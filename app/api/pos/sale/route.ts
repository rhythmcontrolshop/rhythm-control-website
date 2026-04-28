// app/api/pos/sale/route.ts
// POST — Registrar una venta POS (efectivo, tarjeta datáfono, Bizum)

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getPriceChannels, calculateChannelPrice, VAT_RATE } from '@/lib/pricing'

const SaleItemSchema = z.object({
  release_id: z.string().uuid(),
  title: z.string(),
  artists: z.array(z.string()),
  condition: z.string().optional(),
  price_base: z.number().positive(),
  price_channel: z.number().positive(),
  quantity: z.number().int().positive(),
})

const SaleBodySchema = z.object({
  items: z.array(SaleItemSchema).min(1).max(50),
  payment_method: z.enum(['cash', 'card', 'bizum']),
  discount_percentage: z.number().min(0).max(100).default(0),
  cash_received: z.number().nullable().optional(),
  customer_email: z.string().email().optional(),
  customer_name: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // ── Verificar que es admin ──────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return Response.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // ── Parsear y validar ───────────────────────────────────────────
    const raw = await request.json()
    const parsed = SaleBodySchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({
        error: 'Datos de venta inválidos',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 })
    }

    const { items, payment_method, discount_percentage, cash_received, customer_email, customer_name, notes } = parsed.data

    // ── Validar stock disponible ─────────────────────────────────────
    const releaseIds = items.map(i => i.release_id)
    const { data: releases } = await admin
      .from('releases')
      .select('id, status, quantity')
      .in('id', releaseIds)

    for (const item of items) {
      const db = releases?.find(r => r.id === item.release_id)
      if (!db) {
        return Response.json({ error: `Disco no encontrado: ${item.title}` }, { status: 404 })
      }
      if (db.status !== 'active' && db.status !== 'reserved') {
        return Response.json({ error: `Disco no disponible: ${item.title}` }, { status: 409 })
      }
      if (db.quantity < item.quantity) {
        return Response.json({ error: `Stock insuficiente: ${item.title} (disponible: ${db.quantity})` }, { status: 409 })
      }
    }

    // ── Generar número de venta POS ─────────────────────────────────
    const { data: lastSale } = await admin
      .from('pos_sales')
      .select('sale_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let saleNum = 1
    if (lastSale?.sale_number) {
      const match = lastSale.sale_number.match(/POS-(\d{5})/)
      if (match) saleNum = parseInt(match[1], 10) + 1
    }
    const saleNumber = `POS-${String(saleNum).padStart(5, '0')}`

    // ── Calcular totales ────────────────────────────────────────────
    const subtotal = items.reduce((sum, i) => sum + (i.price_channel * i.quantity), 0)
    const discountAmount = subtotal * (discount_percentage / 100)
    const totalAfterDiscount = subtotal - discountAmount
    const taxAmount = Math.round(totalAfterDiscount * VAT_RATE / (1 + VAT_RATE) * 100) / 100
    const total = totalAfterDiscount

    // ── Crear venta POS ─────────────────────────────────────────────
    const { data: sale, error: saleError } = await admin
      .from('pos_sales')
      .insert({
        sale_number: saleNumber,
        operator_id: user.id,
        subtotal,
        tax_rate: VAT_RATE,
        tax_amount: taxAmount,
        total,
        payment_method,
        customer_email: customer_email || null,
        customer_name: customer_name || null,
        notes: notes || (discount_percentage > 0 ? `Descuento ${discount_percentage}%` : null),
      })
      .select('id')
      .single()

    if (saleError || !sale) {
      console.error('POS sale creation error:', saleError)
      return Response.json({ error: 'Error al crear la venta' }, { status: 500 })
    }

    // ── Crear items de venta ─────────────────────────────────────────
    await admin.from('pos_sale_items').insert(
      items.map(item => ({
        pos_sale_id: sale.id,
        release_id: item.release_id,
        title: item.title,
        artists: item.artists,
        condition: item.condition || null,
        price_base: item.price_base,
        price_channel: item.price_channel,
        quantity: item.quantity,
      }))
    )

    // ── Actualizar stock (decrementar) ───────────────────────────────
    for (const item of items) {
      await admin.rpc('decrement_release_quantity', {
        p_release_id: item.release_id,
        p_qty: item.quantity,
      })
    }

    return Response.json({
      sale_id: sale.id,
      sale_number: saleNumber,
      total: total.toFixed(2),
      payment_method,
      cash_received: cash_received?.toFixed(2) ?? null,
      change: payment_method === 'cash' && cash_received
        ? (cash_received - total).toFixed(2)
        : null,
    })

  } catch (err: any) {
    console.error('POS sale error:', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
