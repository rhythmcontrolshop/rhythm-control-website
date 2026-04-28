// app/api/admin/orders/[id]/route.ts
// GET — Detalle de pedido con items
// PATCH — Actualizar estado, tracking, notas, peso

import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { NextRequest }   from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const { id } = await params
  const admin = check.admin

  const { data: order, error } = await admin
    .from('orders')
    .select(`
      id, order_number, status, payment_status, shipping_method,
      customer_name, customer_email, customer_phone,
      shipping_address, pickup_code,
      total, subtotal, shipping_cost, tax_amount, tax_rate,
      stripe_payment_intent, stripe_session_id,
      tracking_number, tracking_url, notes, price_channel, weight,
      created_at, updated_at,
      order_items(id, release_id, title, artists, condition, price_channel, quantity, cover_image)
    `)
    .eq('id', id)
    .single()

  if (error || !order) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 })

  return Response.json(order)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const { id } = await params
  const body = await request.json()
  const admin = check.admin

  const ALLOWED_STATUS = ['created', 'pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'collected', 'cancelled', 'refunded']
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }

  if (body.status && ALLOWED_STATUS.includes(body.status)) {
    updates.status = body.status
  }
  if (body.tracking_number !== undefined) {
    updates.tracking_number = body.tracking_number
  }
  if (body.tracking_url !== undefined) {
    updates.tracking_url = body.tracking_url
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes
  }
  if (body.weight !== undefined) {
    updates.weight = Number(body.weight) || null
  }

  if (Object.keys(updates).length <= 1) {
    return Response.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { error } = await admin.from('orders').update(updates).eq('id', id)

  if (error) return Response.json({ error: 'Error al actualizar' }, { status: 500 })

  // Si se recoge o entrega, marcar releases como vendidos
  if (updates.status === 'collected' || updates.status === 'delivered') {
    const { data: items } = await admin.from('order_items').select('release_id').eq('order_id', id)
    if (items?.length) {
      const releaseIds = items.map(i => i.release_id).filter(Boolean)
      await admin.from('releases').update({ status: 'sold' }).in('id', releaseIds)
    }
  }

  // Si se cancela, devolver releases al inventario
  if (updates.status === 'cancelled') {
    const { data: items } = await admin.from('order_items').select('release_id').eq('order_id', id)
    if (items?.length) {
      const releaseIds = items.map(i => i.release_id).filter(Boolean)
      await admin.from('releases').update({ status: 'active' }).in('id', releaseIds)
    }
  }

  // Si se reembolsa, devolver releases también
  if (updates.status === 'refunded') {
    const { data: items } = await admin.from('order_items').select('release_id').eq('order_id', id)
    if (items?.length) {
      const releaseIds = items.map(i => i.release_id).filter(Boolean)
      await admin.from('releases').update({ status: 'active' }).in('id', releaseIds)
    }
  }

  return Response.json({ ok: true })
}
