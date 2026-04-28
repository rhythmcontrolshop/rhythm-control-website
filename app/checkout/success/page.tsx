import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchParams {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: SearchParams) {
  const params = await searchParams
  const sessionId = params.session_id
  let orderNumber = ''
  let pickupCode = ''
  let orderStatus = ''

  if (sessionId) {
    try {
      const supabase = createAdminClient()
      const { data: order } = await supabase
        .from('orders')
        .select('id, order_number, pickup_code, shipping_method, payment_status, status, customer_email')
        .eq('stripe_session_id', sessionId)
        .single()

      if (order) {
        orderNumber = order.order_number
        pickupCode = order.pickup_code || ''
        orderStatus = order.status

        // Fallback: if webhook hasn't processed yet, update the order directly
        // This handles the case where STRIPE_WEBHOOK_SECRET isn't configured
        if (order.payment_status === 'pending' || order.status === 'created') {
          try {
            const stripe = getStripe()
            const session = await stripe.checkout.sessions.retrieve(sessionId)

            if (session.payment_status === 'paid') {
              // Update order to paid/processing
              await supabase
                .from('orders')
                .update({
                  payment_status: 'paid',
                  status: 'processing',
                  stripe_payment_intent: session.payment_intent as string,
                  customer_email: session.customer_details?.email ?? order.customer_email ?? '',
                  customer_name: session.customer_details?.name ?? '',
                })
                .eq('id', order.id)
                .eq('payment_status', 'pending')

              // Decrement stock for each item
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

              orderStatus = 'processing'
            }
          } catch (fallbackErr) {
            console.error('Fallback payment sync failed:', fallbackErr)
            // Don't block the page — the webhook may process later
          }
        }
      }
    } catch {
      // No bloquear la página si falla la consulta
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6" style={{ backgroundColor: '#000' }}>
      <div className="max-w-md w-full p-8" style={{ border: '2px solid #22c55e' }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: '#22c55e' }}>PEDIDO CONFIRMADO</h1>

        {orderNumber && (
          <p className="font-meta text-sm mb-4" style={{ color: '#FFF' }}>
            Número de pedido: <strong>{orderNumber}</strong>
          </p>
        )}

        {pickupCode && (
          <div className="mb-6 p-4" style={{ border: '2px solid #F0E040', backgroundColor: 'rgba(240, 224, 64, 0.08)' }}>
            <p className="font-meta text-xs mb-1" style={{ color: '#FFF' }}>CÓDIGO DE RECOGIDA</p>
            <p className="font-display text-3xl" style={{ color: '#F0E040', letterSpacing: '0.15em' }}>
              {pickupCode}
            </p>
            <p className="font-meta text-xs mt-2" style={{ color: '#999' }}>
              Presenta este código en nuestra tienda para recoger tu pedido.
            </p>
          </div>
        )}

        {!pickupCode && (
          <p className="font-meta text-sm mb-4" style={{ color: '#FFF' }}>
            Recibirás un email de confirmación con los detalles de tu pedido y el seguimiento del envío.
          </p>
        )}

        <p className="font-meta text-xs mb-6" style={{ color: '#999' }}>
          Gracias por tu compra en Rhythm Control. Si tienes cualquier duda, escríbenos a hola@rhythmcontrolbcn.com
        </p>

        <div className="space-y-3">
          <Link href="/stock"
            className="block w-full text-center font-display text-sm py-3 min-h-[44px] flex items-center justify-center transition-colors duration-200 hover:bg-[#F0E040]"
            style={{ backgroundColor: '#FFF', color: '#000' }}>
            VOLVER AL CATÁLOGO
          </Link>
          <Link href="/cuenta/pedidos"
            className="block w-full text-center font-meta text-xs py-3 min-h-[44px] flex items-center justify-center transition-colors duration-200 hover:bg-[#1a1a1a]"
            style={{ border: '1px solid #666', color: '#999' }}>
            VER MIS PEDIDOS
          </Link>
        </div>
      </div>
    </div>
  )
}
