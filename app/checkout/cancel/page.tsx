// app/checkout/cancel/page.tsx
// Página de pedido cancelado — el usuario canceló o abandonó el checkout
// E2: Ahora libera stock reservado (antes era estática, items quedaban stuck)

import { releaseOrderStock } from '@/lib/checkout/release-order-stock'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchParams {
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutCancelPage({ searchParams }: SearchParams) {
  const params = await searchParams
  const orderNumber = params.order ?? ''

  // Liberar stock si existe una orden pendiente
  if (orderNumber) {
    try {
      await releaseOrderStock(orderNumber)
    } catch {
      // No bloquear la página
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6" style={{ backgroundColor: '#000' }}>
      <div className="max-w-md w-full p-8" style={{ border: '2px solid #FFF' }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: '#FFF' }}>PEDIDO CANCELADO</h1>
        <p className="font-meta text-sm mb-6" style={{ color: '#999' }}>
          Tu pedido no se ha completado. No se ha realizado ningún cargo.
          Los artículos siguen disponibles en el catálogo.
        </p>
        {orderNumber && (
          <p className="font-mono text-xs mb-4" style={{ color: '#666' }}>
            Pedido: {orderNumber}
          </p>
        )}
        <div className="flex gap-3">
          <Link
            href="/stock"
            className="flex-1 text-center font-display text-sm py-3 min-h-[44px] flex items-center justify-center"
            style={{ backgroundColor: '#FFF', color: '#000' }}>
            VOLVER AL CATÁLOGO
          </Link>
          <Link
            href="/cuenta/pedidos"
            className="flex-1 text-center font-display text-sm py-3 min-h-[44px] flex items-center justify-center"
            style={{ border: '2px solid #FFF', color: '#FFF' }}>
            MIS PEDIDOS
          </Link>
        </div>
      </div>
    </div>
  )
}
