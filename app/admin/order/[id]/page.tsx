import Link from 'next/link'

const ORDER = {
  id: 'RC-00235',
  date: '2026-04-13',
  customer: { name: 'Juan Pérez', email: 'juan@example.com', phone: '+34 666 123 456', address: 'Calle de Ejemplo 42, 4º 2ª', city: 'Barcelona', zip: '08001', country: 'España' },
  items: [
    { id: '1', title: 'Strings of Life', artist: 'Rhythim Is Rhythim', price: 45.00, cover: 'https://picsum.photos/seed/ord1/100/100' },
    { id: '2', title: 'Spastik', artist: 'Plastikman', price: 38.00, cover: 'https://picsum.photos/seed/ord2/100/100' },
  ],
  subtotal: 83.00, shipping: 5.90, total: 88.90, status: 'En tránsito', payment: 'Tarjeta ···4242',
  tracking: { code: 'TIPS123456789ES', carrier: 'TIPSA', url: 'https://www.tipsa.es/seguimiento?codigo=TIPS123456789ES',
    history: [
      { date: '2026-04-13 18:30', status: 'Pedido preparado', location: 'Barcelona' },
      { date: '2026-04-14 09:15', status: 'Recogido por transportista', location: 'Barcelona' },
      { date: '2026-04-14 14:20', status: 'En tránsito hacia destino', location: 'Zaragoza' },
      { date: '2026-04-15 08:00', status: 'En reparto', location: 'Madrid' },
    ],
  },
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = ORDER
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto bg-white text-black min-h-screen">
      <header className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
        <Link href="/admin" className="font-display text-xs hover:underline">← VOLVER</Link>
        <h1 className="font-display text-2xl uppercase" style={{ letterSpacing: '-0.05em' }}>PEDIDO {order.id}</h1>
        <span className="font-display text-xs px-3 py-1 bg-yellow-100 text-yellow-800">{order.status.toUpperCase()}</span>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div>
            <h3 className="font-display text-xs mb-2">CLIENTE</h3>
            <p className="font-mono text-sm">{order.customer.name}</p>
            <p className="font-mono text-xs text-gray-600">{order.customer.email}</p>
            <p className="font-mono text-xs text-gray-600">{order.customer.phone}</p>
          </div>
          <div>
            <h3 className="font-display text-xs mb-2">DIRECCIÓN DE ENVÍO</h3>
            <p className="font-mono text-xs leading-relaxed">{order.customer.address}<br />{order.customer.zip} {order.customer.city}<br />{order.customer.country}</p>
          </div>
          <div>
            <h3 className="font-display text-xs mb-2">PAGO</h3>
            <p className="font-mono text-xs">{order.payment}</p>
          </div>
        </div>
        <div className="md:col-span-2 space-y-8">
          <div>
            <h3 className="font-display text-xs mb-4">ARTÍCULOS</h3>
            <div className="border-2 border-black">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 border-b border-gray-300 last:border-b-0">
                  <img src={item.cover} alt={item.title} className="w-12 h-12 object-cover border border-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs uppercase truncate">{item.artist}</p>
                    <p className="font-mono text-xs text-gray-600 truncate">{item.title}</p>
                  </div>
                  <p className="font-display text-sm">{item.price.toFixed(2)} €</p>
                </div>
              ))}
              <div className="p-3 bg-gray-50 space-y-1 text-right">
                <p className="font-mono text-xs text-gray-600">Subtotal: {order.subtotal.toFixed(2)} €</p>
                <p className="font-mono text-xs text-gray-600">Envío (Tipsa): {order.shipping.toFixed(2)} €</p>
                <p className="font-display text-lg">TOTAL: {order.total.toFixed(2)} €</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-display text-xs mb-2">SEGUIMIENTO TIPSA</h3>
            <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-600 hover:underline block mb-4">CÓDIGO: {order.tracking.code} → VER EN WEB</a>
            <div className="border-l-2 border-black pl-4 space-y-4">
              {order.tracking.history.map((step, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-black border-2 border-white" />
                  <p className="font-display text-xs">{step.status}</p>
                  <p className="font-mono text-[10px] text-gray-500">{step.date} · {step.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
