// app/cuenta/pedidos/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Mock por ahora - cuando tengas Stripe, conectas a orders reales
  const orders = [
    { id: 'RC-001', date: '12 Abr 2026', total: 85.00, status: 'Entregado', items: 2 },
    { id: 'RC-002', date: '10 Abr 2026', total: 120.00, status: 'En tránsito', items: 1 },
    { id: 'RC-003', date: '05 Abr 2026', total: 45.00, status: 'Entregado', items: 1 },
  ]

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>
        MIS PEDIDOS
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>
            Aún no tienes pedidos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="p-4" style={{ border: '2px solid #FFFFFF' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>{order.id}</p>
                  <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>{order.total.toFixed(2)} €</p>
                  <p className="font-meta text-xs" style={{ color: '#F0E040' }}>{order.status}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #333' }}>
                <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
                  {order.items} {order.items === 1 ? 'artículo' : 'artículos'}
                </p>
                <button className="font-display text-xs underline" style={{ color: '#FFFFFF' }}>
                  Ver detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
