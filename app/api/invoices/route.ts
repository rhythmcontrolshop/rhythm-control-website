// app/api/invoices/route.ts
// GET  — List invoices
// POST — Generate invoice for an online order

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

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ invoices: data })
}

// ─── POST /api/invoices — Generate invoice for an order ────────────────────
export async function POST(request: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const admin = check.admin
  const body = await request.json()
  const { source_id, customer_nif } = body

  if (!source_id) {
    return Response.json({ error: 'source_id es requerido' }, { status: 400 })
  }

  // Check if invoice already exists for this order
  const { data: existing } = await admin
    .from('invoices')
    .select('id, invoice_number')
    .eq('source_type', 'order')
    .eq('source_id', source_id)
    .maybeSingle()

  if (existing) {
    return Response.json(
      { error: `Ya existe factura ${existing.invoice_number} para este pedido`, existing },
      { status: 409 }
    )
  }

  // Fetch order data
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

  // Get customer NIF from profile if not provided
  let nif = customer_nif || null
  if (!nif) {
    const { data: profile } = await admin
      .from('profiles')
      .select('tax_id')
      .eq('email', order.customer_email)
      .maybeSingle()
    nif = profile?.tax_id || null
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

  // Get seller fiscal data from site_settings
  const { data: settings } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', ['seller_nif', 'seller_address'])

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s: { key: string; value: unknown }) => [
      s.key,
      typeof s.value === 'string' ? JSON.parse(s.value) : s.value,
    ])
  )

  // Create invoice
  const { data: invoice, error } = await admin
    .from('invoices')
    .insert({
      invoice_number:  invoiceNumber,
      source_type:     'order',
      source_id,
      customer_name:   order.customer_name,
      customer_nif:    nif,
      customer_email:  order.customer_email,
      customer_address: order.shipping_address,
      seller_nif:      settingsMap.seller_nif || 'PENDIENTE',
      seller_address:  settingsMap.seller_address || {},
      subtotal:        parseFloat(String(order.subtotal || 0)),
      tax_rate:        parseFloat(String(order.tax_rate || 0.04)),
      tax_amount:      parseFloat(String(order.tax_amount || 0)),
      discount_pct:    0,
      discount_amount: 0,
      total:           parseFloat(String(order.total || 0)),
      lines: (items ?? []).map(item => ({
        title:         item.title,
        artists:       item.artists,
        condition:     item.condition,
        quantity:      item.quantity,
        price_base:    item.price_base,
        price_channel: item.price_channel,
      })),
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Link invoice back to order
  await admin.from('orders').update({ invoice_id: invoice.id }).eq('id', source_id)

  return Response.json({ invoice }, { status: 201 })
}
