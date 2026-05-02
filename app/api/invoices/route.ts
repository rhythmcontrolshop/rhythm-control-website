// app/api/invoices/route.ts
// GET  — List invoices
// POST — Generate invoice for an order or POS sale

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminWithClient } from '@/lib/supabase/require-admin'

// ─── GET /api/invoices ──────────────────────────────────────────────────────
export async function GET(request: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

  const admin = check.admin

  let query = admin
    .from('invoices')
    .select('id, invoice_number, invoice_type, source_type, customer_name, customer_nif, total, status, issued_at')
    .order('issued_at', { ascending: false })
    .limit(limit)

  const status = searchParams.get('status')
  if (status) query = query.eq('status', status)

  const sourceType = searchParams.get('source_type')
  if (sourceType) query = query.eq('source_type', sourceType)

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ invoices: data })
}

// ─── POST /api/invoices — Generate invoice ──────────────────────────────────
export async function POST(request: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const admin = check.admin

  const body = await request.json()
  const { source_type, source_id, customer_nif } = body

  if (!source_type || !source_id) {
    return Response.json({ error: 'source_type y source_id son requeridos' }, { status: 400 })
  }

  if (!['order', 'pos_sale'].includes(source_type)) {
    return Response.json({ error: 'source_type debe ser "order" o "pos_sale"' }, { status: 400 })
  }

  // Check if invoice already exists for this source
  const { data: existing } = await admin
    .from('invoices')
    .select('id, invoice_number')
    .eq('source_type', source_type)
    .eq('source_id', source_id)
    .maybeSingle()

  if (existing) {
    return Response.json({ error: `Ya existe factura ${existing.invoice_number} para este origen`, existing }, { status: 409 })
  }

  // Fetch the source data
  let invoiceData: {
    customer_name: string | null
    customer_email: string | null
    customer_nif: string | null
    customer_address: Record<string, unknown> | null
    subtotal: number
    tax_rate: number
    tax_amount: number
    discount_pct: number
    discount_amount: number
    total: number
    lines: Record<string, unknown>[]
  }

  if (source_type === 'pos_sale') {
    const { data: sale, error: saleError } = await admin
      .from('pos_sales')
      .select('id, customer_name, customer_email, subtotal, tax_rate, tax_amount, discount_pct, discount_amount, total')
      .eq('id', source_id)
      .single()

    if (saleError || !sale) {
      return Response.json({ error: 'Venta POS no encontrada' }, { status: 404 })
    }

    const { data: items } = await admin
      .from('pos_sale_items')
      .select('title, artists, condition, price_base, price_channel, quantity')
      .eq('pos_sale_id', source_id)

    invoiceData = {
      customer_name: sale.customer_name,
      customer_email: sale.customer_email,
      customer_nif: customer_nif || null,
      customer_address: null,
      subtotal: parseFloat(String(sale.subtotal || 0)),
      tax_rate: parseFloat(String(sale.tax_rate || 0.04)),
      tax_amount: parseFloat(String(sale.tax_amount || 0)),
      discount_pct: parseFloat(String(sale.discount_pct || 0)),
      discount_amount: parseFloat(String(sale.discount_amount || 0)),
      total: parseFloat(String(sale.total || 0)),
      lines: (items ?? []).map(item => ({
        title: item.title,
        artists: item.artists,
        condition: item.condition,
        quantity: item.quantity,
        price_base: item.price_base,
        price_channel: item.price_channel,
      })),
    }
  } else {
    // Online order
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, customer_name, customer_email, customer_phone, shipping_address, subtotal, tax_rate, tax_amount, total')
      .eq('id', source_id)
      .single()

    if (orderError || !order) {
      return Response.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const { data: items } = await admin
      .from('order_items')
      .select('title, artists, condition, price_base, price_channel, quantity')
      .eq('order_id', source_id)

    // Get customer NIF from profile if available
    let nif = customer_nif || null
    if (!nif) {
      const { data: profile } = await admin
        .from('profiles')
        .select('tax_id')
        .eq('email', order.customer_email)
        .maybeSingle()
      nif = profile?.tax_id || null
    }

    invoiceData = {
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_nif: nif,
      customer_address: order.shipping_address,
      subtotal: parseFloat(String(order.subtotal || 0)),
      tax_rate: parseFloat(String(order.tax_rate || 0.04)),
      tax_amount: parseFloat(String(order.tax_amount || 0)),
      discount_pct: 0,
      discount_amount: 0,
      total: parseFloat(String(order.total || 0)),
      lines: (items ?? []).map(item => ({
        title: item.title,
        artists: item.artists,
        condition: item.condition,
        quantity: item.quantity,
        price_base: item.price_base,
        price_channel: item.price_channel,
      })),
    }
  }

  // Generate invoice number: F-2026/00001
  const currentYear = new Date().getFullYear()
  const { data: lastInvoice } = await admin
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `F-${currentYear}/%`)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextNum = 1
  if (lastInvoice?.invoice_number) {
    const match = lastInvoice.invoice_number.match(/F-\d{4}\/(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }

  const invoiceNumber = `F-${currentYear}/${String(nextNum).padStart(5, '0')}`

  // Get seller data from site_settings
  const { data: settings } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', ['seller_nif', 'seller_address'])

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s: { key: string; value: unknown }) => [s.key, typeof s.value === 'string' ? JSON.parse(s.value) : s.value])
  )

  // Create invoice
  const { data: invoice, error } = await admin
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      source_type,
      source_id,
      customer_name: invoiceData.customer_name,
      customer_nif: invoiceData.customer_nif,
      customer_email: invoiceData.customer_email,
      customer_address: invoiceData.customer_address,
      seller_nif: settingsMap.seller_nif || 'PENDIENTE',
      seller_address: settingsMap.seller_address || {},
      subtotal: invoiceData.subtotal,
      tax_rate: invoiceData.tax_rate,
      tax_amount: invoiceData.tax_amount,
      discount_pct: invoiceData.discount_pct,
      discount_amount: invoiceData.discount_amount,
      total: invoiceData.total,
      lines: invoiceData.lines,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Link invoice back to source
  const table = source_type === 'pos_sale' ? 'pos_sales' : 'orders'
  await admin.from(table).update({ invoice_id: invoice.id }).eq('id', source_id)

  return Response.json({ invoice }, { status: 201 })
}
