// app/api/webhooks/stripe/route.ts
// Webhook de Stripe — confirma pagos, actualiza órdenes, envía emails

import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 })
  }

  let event
  try {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      // En desarrollo sin webhook secret, parsear directamente
      event = JSON.parse(body)
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const orderId = session.client_reference_id || session.metadata?.order_id

      if (orderId) {
        // Actualizar orden como pagada
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            stripe_payment_intent: session.payment_intent as string,
            status: 'processing',
            customer_email: session.customer_email || session.customer_details?.email,
            customer_name: session.customer_details?.name || '',
          })
          .eq('id', orderId)

        // Si es Click & Collect, mantener status como 'processing'
        // hasta que se confirme la recogida
        const { data: order } = await supabase
          .from('orders')
          .select('pickup_code, shipping_method, order_number, customer_name')
          .eq('id', orderId)
          .single()

        if (order?.pickup_code && order.shipping_method === 'click_collect') {
          // Enviar email con código de recogida
          try {
            const { sendReservationEmail } = await import('@/lib/resend')
            await sendReservationEmail({
              customerName: (order as any).customer_name || session.customer_details?.name || 'Cliente',
              customerEmail: session.customer_email || session.customer_details?.email || '',
              recordTitle: `Pedido ${order.order_number}`,
              recordArtist: 'Rhythm Control',
              pickupCode: order.pickup_code,
            })
          } catch (emailErr) {
            console.error('Failed to send pickup code email:', emailErr)
          }
        }
      }
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object
      const orderId = session.client_reference_id || session.metadata?.order_id

      if (orderId) {
        // Restaurar releases y cancelar orden
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('release_id')
          .eq('order_id', orderId)

        if (orderItems) {
          const releaseIds = orderItems.map(oi => oi.release_id).filter(Boolean)
          await supabase
            .from('releases')
            .update({ status: 'active' })
            .in('id', releaseIds)
        }

        await supabase
          .from('orders')
          .update({ status: 'cancelled', payment_status: 'failed' })
          .eq('id', orderId)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      // No hacemos nada especial — la orden ya está como pending
      break
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`)
  }

  return Response.json({ received: true })
}
