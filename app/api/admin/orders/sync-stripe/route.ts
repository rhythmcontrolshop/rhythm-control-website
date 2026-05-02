// app/api/admin/orders/sync-stripe/route.ts
// POST — Sync payment status from Stripe for pending orders
// Fallback for when webhooks aren't configured or have failed

import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const admin = check.admin

  try {
    // Find orders that are still pending/created but have a Stripe session
    const { data: pendingOrders, error } = await admin
      .from('orders')
      .select('id, stripe_session_id, order_number, payment_status, status')
      .in('payment_status', ['pending', 'failed'])
      .not('stripe_session_id', 'is', null)
      .limit(50)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    if (!pendingOrders?.length) {
      return Response.json({ synced: 0, message: 'No hay pedidos pendientes para sincronizar' })
    }

    const stripe = getStripe()
    let synced = 0
    const results: { order_number: string; status: string; payment_status: string }[] = []

    for (const order of pendingOrders) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)

        if (session.payment_status === 'paid' && order.payment_status !== 'paid') {
          // Update order to paid
          await admin
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'processing',
              stripe_payment_intent: session.payment_intent as string,
              customer_email: session.customer_details?.email ?? '',
              customer_name: session.customer_details?.name ?? '',
            })
            .eq('id', order.id)
            .eq('payment_status', 'pending')

          // Decrement stock
          const { data: items } = await admin
            .from('order_items')
            .select('release_id, quantity')
            .eq('order_id', order.id)

          for (const item of items ?? []) {
            await admin.rpc('decrement_release_quantity', {
              p_release_id: item.release_id,
              p_qty: item.quantity,
            })
          }

          synced++
          results.push({ order_number: order.order_number, status: 'processing', payment_status: 'paid' })
        } else if (session.payment_status === 'unpaid' && session.status === 'expired') {
          // Session expired without payment
          await admin
            .from('orders')
            .update({ status: 'cancelled', payment_status: 'failed' })
            .eq('id', order.id)

          // Restore stock
          const { data: items } = await admin
            .from('order_items')
            .select('release_id')
            .eq('order_id', order.id)

          if (items?.length) {
            const releaseIds = items.map(i => i.release_id).filter(Boolean)
            await admin.from('releases').update({ status: 'active' }).in('id', releaseIds)
          }

          results.push({ order_number: order.order_number, status: 'cancelled', payment_status: 'failed' })
        } else {
          results.push({ order_number: order.order_number, status: order.status, payment_status: order.payment_status })
        }
      } catch (err: any) {
        console.error(`Failed to sync order ${order.order_number}:`, err.message)
        results.push({ order_number: order.order_number, status: order.status, payment_status: order.payment_status })
      }
    }

    return Response.json({ synced, total: pendingOrders.length, results })
  } catch (err: any) {
    return Response.json({ error: err.message || 'Error al sincronizar con Stripe' }, { status: 500 })
  }
}
