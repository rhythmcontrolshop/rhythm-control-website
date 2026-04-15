import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6" style={{ backgroundColor: '#000' }}>
      <div className="max-w-md w-full p-8" style={{ border: '2px solid #FFF' }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: '#FFF' }}>PEDIDO CANCELADO</h1>
        <p className="font-meta text-sm mb-6" style={{ color: '#999' }}>
          Tu pedido no se ha completado. No se ha realizado ningún cargo.
          Los artículos siguen disponibles en el catálogo.
        </p>
        <div className="flex gap-3">
          <Link href="/"
            className="flex-1 text-center font-display text-sm py-3"
            style={{ backgroundColor: '#FFF', color: '#000' }}>
            VOLVER AL CATÁLOGO
          </Link>
          <Link href="/cuenta/pedidos"
            className="flex-1 text-center font-display text-sm py-3"
            style={{ border: '2px solid #FFF', color: '#FFF' }}>
            MIS PEDIDOS
          </Link>
        </div>
      </div>
    </div>
  )
}
