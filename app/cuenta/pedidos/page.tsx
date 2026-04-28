import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created:    { label: 'Creado',     color: '#999' },
  pending:    { label: 'Pendiente',  color: '#f59e0b' },
  paid:       { label: 'Pagado',     color: '#22c55e' },
  processing: { label: 'Procesando', color: '#f59e0b' },
  confirmed:  { label: 'Confirmado', color: '#3b82f6' },
  shipped:    { label: 'Enviado',    color: '#3b82f6' },
  delivered:  { label: 'Entregado',  color: '#22c55e' },
  collected:  { label: 'Recogido',   color: '#22c55e' },
  cancelled:  { label: 'Cancelado',  color: '#ef4444' },
  refunded:   { label: 'Reembolsado', color: '#a855f7' },
}

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let orders: any[] = []
  if (user) {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, order_number, total, status, created_at,
        pickup_code, shipping_method, shipping_cost,
        payment_status, tracking_number,
        order_items(id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    orders = data ?? []
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/cuenta" className="font-meta text-xs" style={{ color: '#F0E040', textDecoration: 'none' }}>← CUENTA</Link>
      </div>

      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>MIS PEDIDOS</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm mb-6" style={{ color: '#999' }}>Aún no tienes pedidos.</p>
          <Link href="/stock" className="font-display text-xs px-6 py-3 inline-block transition-colors duration-200 hover:bg-[#F0E040] hover:text-black"
            style={{ backgroundColor: '#FFFFFF', color: '#000000', border: '2px solid #000000', textDecoration: 'none' }}>
            EXPLORAR STOCK
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.created
            const date = new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
            const itemCount = order.order_items?.length ?? 0
            const isClickCollect = order.shipping_method === 'click_collect'
            const hasTracking = !!order.tracking_number

            return (
              <Link key={order.id} href={`/cuenta/pedidos/${order.id}`} className="block">
                <div className="p-4 transition-colors duration-200 hover:bg-[#1a1a1a] active:bg-[#1a1a1a]"
                  style={{ border: '2px solid #FFFFFF' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>{order.order_number}</p>
                      <p className="font-meta text-xs" style={{ color: '#999' }}>{date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>{Number(order.total).toFixed(2)} €</p>
                      <span className="font-meta text-xs" style={{ color: st.color }}>{st.label}</span>
                    </div>
                  </div>

                  {/* Order details row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
                    <span className="font-meta text-[0.6rem]" style={{ color: '#666' }}>
                      {itemCount} {itemCount === 1 ? 'disco' : 'discos'}
                    </span>
                    {order.shipping_cost > 0 && (
                      <span className="font-meta text-[0.6rem]" style={{ color: '#666' }}>
                        Envío: {Number(order.shipping_cost).toFixed(2)} €
                      </span>
                    )}
                    {isClickCollect && (
                      <span className="font-meta text-[0.6rem]" style={{ color: '#F0E040' }}>GUARDI (Click&Collect)</span>
                    )}
                    {hasTracking && (
                      <span className="font-meta text-[0.6rem]" style={{ color: '#3b82f6' }}>Con seguimiento</span>
                    )}
                  </div>

                  {order.pickup_code && (
                    <div className="mt-3 p-3" style={{ border: '1px solid #F0E040', backgroundColor: 'rgba(240, 224, 64, 0.05)' }}>
                      <p className="font-meta text-xs" style={{ color: '#999' }}>CÓDIGO DE RECOGIDA</p>
                      <p className="font-display text-lg" style={{ color: '#F0E040', letterSpacing: '0.1em' }}>{order.pickup_code}</p>
                    </div>
                  )}
                  {order.payment_status === 'pending' && (
                    <p className="font-meta text-xs mt-2" style={{ color: '#f59e0b' }}>Pago pendiente</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
