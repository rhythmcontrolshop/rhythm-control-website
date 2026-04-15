import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchParams {
  searchParams: { session_id?: string }
}

export default async function CheckoutSuccessPage({ searchParams }: SearchParams) {
  const sessionId = searchParams.session_id
  let orderNumber = ''
  let pickupCode = ''

  if (sessionId) {
    try {
      const supabase = createAdminClient()
      const { data: order } = await supabase
        .from('orders')
        .select('order_number, pickup_code, shipping_method')
        .eq('stripe_session_id', sessionId)
        .single()

      if (order) {
        orderNumber = order.order_number
        pickupCode = order.pickup_code || ''
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

        <Link href="/"
          className="block w-full text-center font-display text-sm py-3"
          style={{ backgroundColor: '#FFF', color: '#000' }}>
          VOLVER AL CATÁLOGO
        </Link>
      </div>
    </div>
  )
}
