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
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
        <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>PEDIDO {order.id}</h1>
        <span className="text-xs px-3 py-1" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>{order.status.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>CLIENTE</h3>
            <p className="text-sm" style={{ color: '#000000' }}>{order.customer.name}</p>
            <p className="text-xs" style={{ color: '#6b7280' }}>{order.customer.email}</p>
            <p className="text-xs" style={{ color: '#6b7280' }}>{order.customer.phone}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>DIRECCIÓN DE ENVÍO</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{order.customer.address}<br />{order.customer.zip} {order.customer.city}<br />{order.customer.country}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>PAGO</h3>
            <p className="text-xs" style={{ color: '#374151' }}>{order.payment}</p>
          </div>
        </div>
        <div className="md:col-span-2 space-y-8">
          <div>
            <h3 className="text-xs font-medium mb-4" style={{ color: '#6b7280' }}>ARTÍCULOS</h3>
            <div style={{ border: '1px solid #d1d5db' }}>
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <img src={item.cover} alt={item.title} className="w-12 h-12 object-cover" style={{ border: '1px solid #d1d5db' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase truncate" style={{ color: '#000000' }}>{item.artist}</p>
                    <p className="text-xs truncate" style={{ color: '#6b7280' }}>{item.title}</p>
                  </div>
                  <p className="text-sm" style={{ color: '#000000' }}>{item.price.toFixed(2)} €</p>
                </div>
              ))}
              <div className="p-3 space-y-1 text-right" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-xs" style={{ color: '#6b7280' }}>Subtotal: {order.subtotal.toFixed(2)} €</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>Envío (Tipsa): {order.shipping.toFixed(2)} €</p>
                <p className="text-lg font-bold" style={{ color: '#000000' }}>TOTAL: {order.total.toFixed(2)} €</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>SEGUIMIENTO TIPSA</h3>
            <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline block mb-4" style={{ color: '#2563eb' }}>CÓDIGO: {order.tracking.code} → VER EN WEB</a>
            <div className="pl-4 space-y-4" style={{ borderLeft: '2px solid #000000' }}>
              {order.tracking.history.map((step, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full" style={{ backgroundColor: '#000000', border: '2px solid #FFFFFF' }} />
                  <p className="text-xs font-medium" style={{ color: '#000000' }}>{step.status}</p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{step.date} · {step.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
