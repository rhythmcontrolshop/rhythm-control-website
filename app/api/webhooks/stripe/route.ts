// app/api/webhooks/stripe/route.ts
// Webhook de Stripe — confirma pagos, gestiona suscripciones, evita duplicados

import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = (await headers()).get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return Response.json({ error: 'Webhook not configured' }, { status: 503 })
  }
  if (!sig) {
    return Response.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── Idempotencia: ignorar eventos ya procesados ───────────────
  const { data: seen } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (seen) return Response.json({ received: true })

  await supabase.from('stripe_events').insert({ id: event.id, type: event.type })

  // ── Dispatch ──────────────────────────────────────────────────
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.client_reference_id ?? session.metadata?.order_id
      if (!orderId) break

      // Actualizar orden — guard: solo si sigue en pending
      const { data: order } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          stripe_payment_intent: session.payment_intent as string,
          customer_email: session.customer_details?.email ?? session.customer_email ?? '',
          customer_name: session.customer_details?.name ?? '',
        })
        .eq('id', orderId)
        .eq('payment_status', 'pending')
        .select('pickup_code, shipping_method, order_number, customer_name')
        .single()

      if (!order) break // ya procesado o inexistente

      // Decrementar stock de cada release
      const { data: items } = await supabase
        .from('order_items')
        .select('release_id, quantity')
        .eq('order_id', orderId)

      for (const item of items ?? []) {
        await supabase.rpc('decrement_release_quantity', {
          p_release_id: item.release_id,
          p_qty: item.quantity,
        })
      }

      // Email con código de recogida (solo Click & Collect)
      if (order.pickup_code && order.shipping_method === 'click_collect') {
        try {
          const { sendReservationEmail } = await import('@/lib/resend')
          await sendReservationEmail({
            customerName: order.customer_name ?? session.customer_details?.name ?? 'Cliente',
            customerEmail: session.customer_details?.email ?? '',
            recordTitle: `Pedido ${order.order_number}`,
            recordArtist: 'Rhythm Control',
            pickupCode: order.pickup_code,
          })
        } catch (emailErr) {
          console.error('Failed to send pickup code email:', emailErr)
        }
      }
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.client_reference_id ?? session.metadata?.order_id
      if (!orderId) break

      const { data: items } = await supabase
        .from('order_items')
        .select('release_id')
        .eq('order_id', orderId)

      if (items?.length) {
        await supabase
          .from('releases')
          .update({ status: 'active' })
          .in('id', items.map(i => i.release_id).filter(Boolean))
      }

      await supabase
        .from('orders')
        .update({ status: 'cancelled', payment_status: 'failed' })
        .eq('id', orderId)
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('stripe_payment_intent', pi.id)
        .eq('payment_status', 'pending')
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      if (!charge.payment_intent) break

      // Buscar la orden por payment_intent
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_payment_intent', charge.payment_intent as string)
        .single()

      if (!order) break

      await supabase
        .from('orders')
        .update({ payment_status: 'refunded', status: 'cancelled' })
        .eq('id', order.id)

      // Restaurar stock de cada release
      const { data: items } = await supabase
        .from('order_items')
        .select('release_id, quantity')
        .eq('order_id', order.id)

      for (const item of items ?? []) {
        await supabase.rpc('restore_release_quantity', {
          p_release_id: item.release_id,
          p_qty: item.quantity,
        })
      }
      break
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      if (!dispute.payment_intent) break

      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_payment_intent', dispute.payment_intent as string)
        .single()

      if (!order) break

      await supabase
        .from('orders')
        .update({
          payment_status: 'disputed',
          notes: `Disputa Stripe: ${dispute.reason} — ${dispute.amount / 100} ${dispute.currency.toUpperCase()} — ID: ${dispute.id}`,
        })
        .eq('id', order.id)
      break
    }
  }

  return Response.json({ received: true })
}
