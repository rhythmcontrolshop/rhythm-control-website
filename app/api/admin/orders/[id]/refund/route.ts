// app/api/admin/orders/[id]/refund/route.ts
// POST — Reembolsar un pedido via Stripe + actualizar estado

import { requireAdmin } from '@/lib/supabase/require-admin'
import { getStripe } from '@/lib/stripe'
import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (!check.ok) return check.response

  const { id } = await params

  const { data: order, error: orderError } = await check.admin
    .from('orders')
    .select('id, status, payment_status, stripe_payment_intent, order_items(release_id, quantity)')
    .eq('id', id)
    .single()

  if (orderError || !order) {
    return Response.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  if (order.payment_status !== 'paid') {
    return Response.json({ error: 'El pedido no está pagado' }, { status: 400 })
  }

  if (!order.stripe_payment_intent) {
    return Response.json({ error: 'No hay Payment Intent de Stripe' }, { status: 400 })
  }

  try {
    await getStripe().refunds.create({
      payment_intent: order.stripe_payment_intent,
      reason: 'requested_by_customer',
    })
  } catch (err: any) {
    console.error('Stripe refund error:', err.message)
    return Response.json({ error: 'Error al procesar el reembolso en Stripe' }, { status: 500 })
  }

  // El webhook charge.refunded actualizará el estado final y restaurará stock.
  // Marcamos como refunded aquí para feedback inmediato en el admin.
  await check.admin
    .from('orders')
    .update({ payment_status: 'refunded', status: 'cancelled' })
    .eq('id', id)

  return Response.json({ ok: true, message: 'Reembolso procesado' })
}
