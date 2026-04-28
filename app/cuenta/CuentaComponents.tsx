'use client'

import Link from 'next/link'

export function OrderRow({ order }: { order: any }) {
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
  const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.created
  const itemCount = order.order_items?.length ?? 0
  const isClickCollect = order.shipping_method === 'click_collect'

  return (
    <Link href={`/cuenta/pedidos/${order.id}`} className="block">
      <div className="flex items-center justify-between p-4 transition-colors duration-200 hover:bg-[#1a1a1a] active:bg-[#1a1a1a]"
        style={{ border: '2px solid #FFFFFF', minHeight: '44px' }}>
        <div>
          <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{order.order_number || order.id.slice(0, 8)}</p>
          <p className="font-meta text-xs" style={{ color: '#999' }}>{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
          <div className="flex gap-3 mt-1">
            <span className="font-meta text-[0.6rem]" style={{ color: '#666' }}>
              {itemCount} {itemCount === 1 ? 'disco' : 'discos'}
            </span>
            {order.shipping_cost > 0 && (
              <span className="font-meta text-[0.6rem]" style={{ color: '#666' }}>
                Envío: {Number(order.shipping_cost).toFixed(2)} €
              </span>
            )}
            {isClickCollect && (
              <span className="font-meta text-[0.6rem]" style={{ color: '#F0E040' }}>Guardi</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{Number(order.total).toFixed(2)} €</p>
          <span className="font-meta text-[0.6rem]" style={{ color: st.color }}>{st.label}</span>
        </div>
      </div>
    </Link>
  )
}
