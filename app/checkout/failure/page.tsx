// app/checkout/failure/page.tsx
// Página de pago fallido — Redsys redirige aquí cuando el pago no se completa

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchParams {
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutFailurePage({ searchParams }: SearchParams) {
  const params = await searchParams
  const orderNumber = params.order ?? ''

  // Intentar liberar stock si la orden existe
  if (orderNumber) {
    try {
      const supabase = createAdminClient()
      const { data: order } = await supabase
        .from('orders')
        .select('id, payment_status, status')
        .eq('order_number', orderNumber)
        .single()

      if (order && order.payment_status === 'pending') {
        // Liberar stock reservado
        const { data: items } = await supabase
          .from('order_items')
          .select('release_id')
          .eq('order_id', order.id)

        if (items?.length) {
          await supabase
            .from('releases')
            .update({ status: 'active' })
            .in('id', items.map(i => i.release_id).filter(Boolean))
        }

        await supabase
          .from('orders')
          .update({ status: 'cancelled', payment_status: 'failed' })
          .eq('id', order.id)
      }
    } catch {
      // No bloquear la página
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6" style={{ backgroundColor: '#000' }}>
      <div className="max-w-md w-full p-8" style={{ border: '2px solid #ef4444' }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: '#ef4444' }}>PAGO NO COMPLETADO</h1>
        <p className="font-mono text-sm mb-4" style={{ color: '#999' }}>
          Tu pago no se ha podido procesar. No se ha realizado ningún cargo.
          Los artículos siguen disponibles en el catálogo.
        </p>
        {orderNumber && (
          <p className="font-mono text-xs mb-4" style={{ color: '#666' }}>
            Pedido: {orderNumber}
          </p>
        )}
        <div className="flex gap-3">
          <Link
            href="/checkout"
            className="flex-1 text-center font-display text-sm py-3 min-h-[44px] flex items-center justify-center transition-colors duration-200"
            style={{ backgroundColor: '#FFF', color: '#000' }}
          >
            REINTENTAR
          </Link>
          <Link
            href="/stock"
            className="flex-1 text-center font-display text-sm py-3 min-h-[44px] flex items-center justify-center transition-colors duration-200"
            style={{ border: '2px solid #FFF', color: '#FFF' }}
          >
            CATÁLOGO
          </Link>
        </div>
      </div>
    </div>
  )
}
