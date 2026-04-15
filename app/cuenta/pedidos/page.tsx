// app/cuenta/pedidos/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created:    { label: 'Creado',       color: '#999' },
  processing: { label: 'Procesando',   color: '#f59e0b' },
  shipped:    { label: 'Enviado',      color: '#3b82f6' },
  delivered:  { label: 'Entregado',    color: '#22c55e' },
  collected:  { label: 'Recogido',     color: '#22c55e' },
  cancelled:  { label: 'Cancelado',    color: '#ef4444' },
}

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let orders: any[] = []

  if (user) {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, status, created_at, pickup_code, shipping_method, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    orders = data ?? []
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>
        MIS PEDIDOS
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm mb-6" style={{ color: '#999' }}>
            Aún no tienes pedidos.
          </p>
          <Link href="/"
            className="font-display text-xs px-6 py-3"
            style={{ backgroundColor: '#FFF', color: '#000' }}>
            EXPLORAR CATÁLOGO
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.created
            const date = new Date(order.created_at).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', year: 'numeric'
            })
            return (
              <div key={order.id} className="p-4" style={{ border: '2px solid #FFFFFF' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>{order.order_number}</p>
                    <p className="font-meta text-xs" style={{ color: '#999' }}>{date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>
                      {Number(order.total).toFixed(2)} €
                    </p>
                    <span className="font-meta text-xs" style={{ color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {order.pickup_code && (
                  <div className="mb-3 p-3" style={{ border: '1px solid #F0E040', backgroundColor: 'rgba(240, 224, 64, 0.05)' }}>
                    <p className="font-meta text-xs" style={{ color: '#999' }}>CÓDIGO DE RECOGIDA</p>
                    <p className="font-display text-lg" style={{ color: '#F0E040', letterSpacing: '0.1em' }}>
                      {order.pickup_code}
                    </p>
                  </div>
                )}

                {order.payment_status === 'pending' && (
                  <p className="font-meta text-xs" style={{ color: '#f59e0b' }}>
                    Pago pendiente
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
