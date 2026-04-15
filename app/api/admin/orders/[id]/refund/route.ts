// app/api/admin/orders/[id]/refund/route.ts
// POST — Reembolsar un pedido via Stripe + actualizar estado

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { getStripe }          from '@/lib/stripe'
import { NextRequest }        from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()

  // Obtener el pedido
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, status, payment_status, stripe_payment_intent, order_items(release_id)')
    .eq('id', id)
    .single()

  if (orderError || !order) {
    return Response.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  if (order.payment_status !== 'paid') {
    return Response.json({ error: 'El pedido no esta pagado' }, { status: 400 })
  }

  if (!order.stripe_payment_intent) {
    return Response.json({ error: 'No hay Payment Intent de Stripe' }, { status: 400 })
  }

  // Procesar reembolso via Stripe
  try {
    const stripe = getStripe()
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent,
      reason: 'requested_by_customer',
    })
  } catch (err: any) {
    console.error('Stripe refund error:', err.message)
    return Response.json({ error: `Error de Stripe: ${err.message}` }, { status: 500 })
  }

  // Actualizar estado del pedido
  await admin
    .from('orders')
    .update({
      status: 'refunded',
      payment_status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // Devolver releases al inventario
  const items = order.order_items as any[]
  if (items?.length) {
    const releaseIds = items.map((i: any) => i.release_id).filter(Boolean)
    await admin.from('releases').update({ status: 'active' }).in('id', releaseIds)
  }

  return Response.json({ ok: true, message: 'Reembolso procesado' })
}
