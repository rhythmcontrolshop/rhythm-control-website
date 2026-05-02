// app/checkout/success/page.tsx
// Página de confirmación de pago — adaptada para Redsys
// Redsys redirige aquí con parámetros POST (Ds_MerchantParameters, Ds_Signature)
// También soporta GET con ?order=RC-XXXXX como fallback

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyResponseParameters, isPaymentSuccessful, centsToEuros } from '@/lib/redsys'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchParams {
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: SearchParams) {
  const params = await searchParams
  const orderNumber = params.order ?? ''

  let pickupCode = ''
  let isGUARDI = false
  let orderStatus = ''
  let paymentVerified = false
  let customerEmail = ''

  // ── Intentar verificar respuesta de Redsys (si viene por GET con params) ──
  // Nota: Redsys envía la confirmación real por IPN al webhook.
  // La redirección del usuario es solo informativa.

  if (orderNumber) {
    try {
      const supabase = createAdminClient()
      const { data: order } = await supabase
        .from('orders')
        .select('id, order_number, pickup_code, shipping_method, payment_status, status, customer_email')
        .eq('order_number', orderNumber)
        .single()

      if (order) {
        pickupCode = order.pickup_code || ''
        isGUARDI = order.shipping_method === 'click_collect'
        orderStatus = order.status
        customerEmail = order.customer_email ?? ''

        // Si el webhook ya procesó el pago, mostrar confirmación
        if (order.payment_status === 'paid') {
          paymentVerified = true
        } else if (order.payment_status === 'pending') {
          // El IPN puede tardar unos segundos — mostrar mensaje de "procesando"
          paymentVerified = false
        }
      }
    } catch {
      // No bloquear la página si falla la consulta
    }
  }

  // Si el pago sigue pendiente, auto-refresh cada 3s hasta que el webhook lo procese
  const metaRefresh = !paymentVerified && orderNumber
    ? <meta httpEquiv="refresh" content="3" />
    : null

  return (
    <>
      {metaRefresh}
    <div className="min-h-[80vh] flex items-center justify-center p-6" style={{ backgroundColor: '#000' }}>
      <div className="max-w-md w-full p-8" style={{ border: '2px solid #22c55e' }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: '#22c55e' }}>
          {paymentVerified ? 'PEDIDO CONFIRMADO' : 'PROCESANDO PAGO'}
        </h1>

        {orderNumber && (
          <p className="font-mono text-sm mb-4" style={{ color: '#FFF' }}>
            Número de pedido: <strong>{orderNumber}</strong>
          </p>
        )}

        {!paymentVerified && (
          <p className="font-mono text-sm mb-4" style={{ color: '#F0E040' }}>
            Tu pago se está procesando. Recibirás un email de confirmación en breve.
          </p>
        )}

        {pickupCode && (
          <div className="mb-6 p-4" style={{ border: '2px solid #F0E040', backgroundColor: 'rgba(240, 224, 64, 0.08)' }}>
            <p className="font-mono text-xs mb-1" style={{ color: '#FFF' }}>CÓDIGO DE RECOGIDA</p>
            <p className="font-display text-3xl" style={{ color: '#F0E040', letterSpacing: '0.15em' }}>
              {pickupCode}
            </p>
            <p className="font-mono text-xs mt-2" style={{ color: '#999' }}>
              Presenta este código en nuestra tienda para recoger tu pedido.
            </p>
          </div>
        )}

        {!pickupCode && paymentVerified && (
          <p className="font-mono text-sm mb-4" style={{ color: '#FFF' }}>
            Recibirás un email de confirmación con los detalles de tu pedido y el seguimiento del envío.
          </p>
        )}

        <p className="font-mono text-xs mb-6" style={{ color: '#999' }}>
          Gracias por tu compra en Rhythm Control. Si tienes cualquier duda, escríbenos a hola@rhythmcontrolbcn.com
        </p>

        <div className="space-y-3">
          <Link
            href="/stock"
            className="block w-full text-center font-display text-sm py-3 min-h-[44px] flex items-center justify-center transition-colors duration-200 hover:bg-[#F0E040]"
            style={{ backgroundColor: '#FFF', color: '#000' }}
          >
            VOLVER AL CATÁLOGO
          </Link>
          <Link
            href="/cuenta/pedidos"
            className="block w-full text-center font-mono text-xs py-3 min-h-[44px] flex items-center justify-center transition-colors duration-200 hover:bg-[#1a1a1a]"
            style={{ border: '1px solid #666', color: '#999' }}
          >
            VER MIS PEDIDOS
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
