// app/api/webhooks/redsys/route.ts
// Webhook de Redsys — notificación IPN asíncrona tras el pago
// Redsys envía POST con Ds_MerchantParameters, Ds_Signature, Ds_SignatureVersion

import { verifyResponseParameters, isPaymentSuccessful, getResponseMessage, centsToEuros } from '@/lib/redsys'
import { createAdminClient } from '@/lib/supabase/admin'

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

    // ── Verificar firma ──────────────────────────────────────────
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

    // ── Idempotencia: evitar procesar la misma notificación ──────
    const supabase = createAdminClient()
    const notificationId = `${response.Ds_Order}_${response.Ds_Response}_${response.Ds_Date}_${response.Ds_Hour}`

    const { data: seen } = await supabase
      .from('redsys_notifications')
      .select('id')
      .eq('id', notificationId)
      .maybeSingle()

    if (seen) {
      console.log('Redsys IPN: already processed', notificationId)
      return new Response('OK', { status: 200 })
    }

    // Guardar notificación para idempotencia
    await supabase.from('redsys_notifications').insert({
      id: notificationId,
      ds_order: response.Ds_Order ?? '',
      ds_response: response.Ds_Response ?? '',
      ds_amount: response.Ds_Amount ?? '',
      ds_authorisation_code: response.Ds_AuthorisationCode ?? '',
      ds_date: response.Ds_Date ?? '',
      ds_hour: response.Ds_Hour ?? '',
      raw_data: response,
    })

    // ── Buscar la orden por redsys_order_reference ───────────────
    const dsOrder = response.Ds_Order
    if (!dsOrder) {
      console.error('Redsys IPN: no Ds_Order in response')
      return new Response('OK', { status: 200 })
    }

    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, status, pickup_code, shipping_method, customer_name, customer_email')
      .eq('redsys_order_ref', dsOrder)
      .maybeSingle()

    if (!order) {
      console.error('Redsys IPN: order not found for reference', dsOrder)
      return new Response('OK', { status: 200 })
    }

    // ── Procesar resultado del pago ──────────────────────────────
    const dsResponse = response.Ds_Response ?? ''
    const paymentOk = isPaymentSuccessful(dsResponse)

    if (paymentOk) {
      // ── Pago exitoso ────────────────────────────────────────
      if (order.payment_status === 'paid') {
        console.log('Redsys IPN: order already paid', order.order_number)
        return new Response('OK', { status: 200 })
      }

      const paidAmount = response.Ds_Amount ? centsToEuros(parseInt(response.Ds_Amount)) : null

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
        .select('pickup_code, shipping_method, order_number, customer_name')
        .single()

      if (updated) {
        // Decrementar stock de los items
        const { data: items } = await supabase
          .from('order_items')
          .select('release_id, quantity')
          .eq('order_id', order.id)

        for (const item of items ?? []) {
          await supabase.rpc('decrement_release_quantity', {
            p_release_id: item.release_id,
            p_qty: item.quantity,
          })
        }

        // Enviar email de confirmación / código de recogida
        if (updated.pickup_code && updated.shipping_method === 'click_collect') {
          try {
            const { sendReservationEmail } = await import('@/lib/resend')
            await sendReservationEmail({
              customerName: updated.customer_name ?? 'Cliente',
              customerEmail: order.customer_email ?? '',
              recordTitle: `Pedido ${updated.order_number}`,
              recordArtist: 'Rhythm Control',
              pickupCode: updated.pickup_code,
            })
          } catch (emailErr) {
            console.error('Failed to send pickup code email:', emailErr)
          }
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
