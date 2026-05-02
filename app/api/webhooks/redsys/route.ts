// app/api/webhooks/redsys/route.ts
// Webhook de Redsys — notificación IPN asíncrona tras el pago
// Redsys envía POST con Ds_MerchantParameters, Ds_Signature, Ds_SignatureVersion
//
// E2: Refactor robusto
// - Reordenado: orden first → event second (evita perder notificaciones de órdenes no encontradas)
// - Amount verification: compara Ds_Amount con order.total antes de procesar
// - Tabla renombrada: redsys_events (consistencia con stripe_events)
// - Email confirmación para TODOS los métodos de envío (no solo GUARDI)
// - Notificación al admin en cada pago exitoso

import { verifyResponseParameters, isPaymentSuccessful, getResponseMessage, centsToEuros, eurosToCents } from '@/lib/redsys'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmationEmail, sendAdminNotification } from '@/lib/resend'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const merchantParams = formData.get('Ds_MerchantParameters') as string
    const signature = formData.get('Ds_Signature') as string
    const signatureVersion = formData.get('Ds_SignatureVersion') as string

    if (!merchantParams || !signature) {
      console.error('Redsys IPN: missing parameters')
      return new Response('Missing parameters', { status: 400 })
    }

    console.log('Redsys IPN received, version:', signatureVersion)

    // ── 1. Verificar firma ─────────────────────────────────────
    const response = verifyResponseParameters(merchantParams, signature)
    if (!response) {
      console.error('Redsys IPN: signature verification failed')
      return new Response('Invalid signature', { status: 400 })
    }

    console.log('Redsys IPN verified:', {
      order: response.Ds_Order,
      response: response.Ds_Response,
      amount: response.Ds_Amount,
    })

    const supabase = createAdminClient()
    const notificationId = `${response.Ds_Order}_${response.Ds_Response}_${response.Ds_Date}_${response.Ds_Hour}`

    // ── 2. Idempotencia: ya procesada? ─────────────────────────
    const { data: seen } = await supabase
      .from('redsys_events')
      .select('id')
      .eq('id', notificationId)
      .maybeSingle()

    if (seen) {
      console.log('Redsys IPN: already processed', notificationId)
      return new Response('OK', { status: 200 })
    }

    // ── 3. Buscar la orden PRIMERO (antes de guardar evento) ──
    const dsOrder = response.Ds_Order
    if (!dsOrder) {
      console.error('Redsys IPN: no Ds_Order in response')
      return new Response('OK', { status: 200 })
    }

    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, status, pickup_code, shipping_method, customer_name, customer_email, total')
      .eq('redsys_order_ref', dsOrder)
      .maybeSingle()

    if (!order) {
      // No guardar evento — dejar que Redsys reenvíe
      console.error('Redsys IPN: order not found for reference', dsOrder, '(event NOT saved to allow retry)')
      return new Response('OK', { status: 200 })
    }

    // ── 4. Verificar importe ───────────────────────────────────
    const dsAmount = response.Ds_Amount ? parseInt(response.Ds_Amount, 10) : null
    const expectedAmount = eurosToCents(order.total ?? 0)

    if (dsAmount !== null && dsAmount !== expectedAmount) {
      console.error('Redsys IPN: amount mismatch', {
        order: order.order_number,
        expected: expectedAmount,
        received: dsAmount,
      })
      // Guardar evento como mismatch pero NO procesar el pago
      await supabase.from('redsys_events').insert({
        id: notificationId,
        ds_order: dsOrder,
        ds_response: response.Ds_Response ?? '',
        ds_amount: response.Ds_Amount ?? '',
        ds_authorisation_code: response.Ds_AuthorisationCode ?? '',
        ds_date: response.Ds_Date ?? '',
        ds_hour: response.Ds_Hour ?? '',
        raw_data: response,
        processed_amount_cents: dsAmount,
        processing_result: 'amount_mismatch',
      })
      return new Response('OK', { status: 200 })
    }

    // ── 5. Guardar evento (orden existe e importe correcto) ────
    await supabase.from('redsys_events').insert({
      id: notificationId,
      ds_order: dsOrder,
      ds_response: response.Ds_Response ?? '',
      ds_amount: response.Ds_Amount ?? '',
      ds_authorisation_code: response.Ds_AuthorisationCode ?? '',
      ds_date: response.Ds_Date ?? '',
      ds_hour: response.Ds_Hour ?? '',
      raw_data: response,
      processed_amount_cents: dsAmount,
      processing_result: 'processed',
    })

    // ── 6. Procesar resultado del pago ─────────────────────────
    const dsResponse = response.Ds_Response ?? ''
    const paymentOk = isPaymentSuccessful(dsResponse)

    if (paymentOk) {
      // ── Pago exitoso ────────────────────────────────────────
      if (order.payment_status === 'paid') {
        console.log('Redsys IPN: order already paid', order.order_number)
        return new Response('OK', { status: 200 })
      }

      // UPDATE con guard WHERE — solo actualiza si sigue pending
      const { data: updated } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          redsys_authorisation_code: response.Ds_AuthorisationCode ?? null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', order.id)
        .eq('payment_status', 'pending')
        .select('pickup_code, shipping_method, order_number, customer_name, customer_email, total')
        .single()

      if (updated) {
        // Decrementar stock de los items
        const { data: items } = await supabase
          .from('order_items')
          .select('release_id, quantity, title, artists, price_channel')
          .eq('order_id', order.id)

        for (const item of items ?? []) {
          await supabase.rpc('decrement_release_quantity', {
            p_release_id: item.release_id,
            p_qty: item.quantity,
          })
        }

        // ── Email de confirmación (TODOS los métodos de envío) ──
        const emailItems = (items ?? []).map(item => ({
          artist: (item.artists ?? ['Desconocido']).join(', '),
          title: item.title ?? 'Sin título',
          price: `${(item.price_channel ?? 0).toFixed(2)}€`,
        }))

        try {
          await sendOrderConfirmationEmail({
            customerName: updated.customer_name ?? 'Cliente',
            customerEmail: order.customer_email ?? '',
            orderNumber: updated.order_number,
            items: emailItems,
            total: `${(updated.total ?? 0).toFixed(2)}€`,
            shippingMethod: updated.shipping_method === 'click_collect'
              ? 'Recogida en tienda (GUARDI)'
              : updated.shipping_method === 'post_office'
                ? 'Envío a oficina de correos'
                : updated.shipping_method === 'home_delivery'
                  ? 'Envío a domicilio'
                  : undefined,
            pickupCode: updated.pickup_code ?? undefined,
          })
          console.log('Redsys IPN: confirmation email sent', updated.order_number)
        } catch (emailErr) {
          console.error('Redsys IPN: failed to send confirmation email:', emailErr)
        }

        // ── Notificar al admin ─────────────────────────────────
        try {
          await sendAdminNotification({
            customerName: updated.customer_name ?? 'Cliente',
            customerEmail: order.customer_email ?? '',
            recordTitle: `Pedido ${updated.order_number}`,
            recordArtist: `Total: ${(updated.total ?? 0).toFixed(2)}€`,
            pickupCode: updated.pickup_code ?? undefined,
          })
        } catch (adminErr) {
          console.error('Redsys IPN: failed to send admin notification:', adminErr)
        }

        console.log('Redsys IPN: order paid successfully', order.order_number)
      }
    } else {
      // ── Pago fallido ────────────────────────────────────────
      const errorMsg = getResponseMessage(dsResponse)
      console.log('Redsys IPN: payment failed', order.order_number, dsResponse, errorMsg)

      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          notes: `Pago Redsys denegado: ${dsResponse} — ${errorMsg ?? 'Sin detalle'}`,
        })
        .eq('id', order.id)
        .eq('payment_status', 'pending')
    }

    // Redsys espera siempre una respuesta HTTP 200 con cuerpo específico
    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('Redsys IPN error:', err)
    return new Response('Error', { status: 500 })
  }
}
