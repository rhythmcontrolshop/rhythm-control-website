'use client'
// app/checkout/error.tsx — E5-1: Error boundary para sección checkout

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4" style={{ backgroundColor: '#000000' }}>
      <h2 className="font-display text-xl mb-4" style={{ color: '#F0E040' }}>Error en el checkout</h2>
      <p className="font-meta text-sm mb-6" style={{ color: '#999999' }}>{error.message || 'Ha ocurrido un error al procesar tu pago.'}</p>
      <button
        onClick={reset}
        className="font-display text-sm px-6 py-3"
        style={{ backgroundColor: '#F0E040', color: '#000000', minHeight: '44px', cursor: 'pointer' }}
      >
        REINTENTAR
      </button>
    </div>
  )
}
