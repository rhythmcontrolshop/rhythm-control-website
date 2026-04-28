import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created:    { label: 'Creado',     color: '#999' },
  pending:    { label: 'Pendiente',  color: '#f59e0b' },
  processing: { label: 'Procesando', color: '#f59e0b' },
  confirmed:  { label: 'Confirmado', color: '#3b82f6' },
  shipped:    { label: 'Enviado',    color: '#3b82f6' },
  delivered:  { label: 'Entregado',  color: '#22c55e' },
  collected:  { label: 'Recogido',   color: '#22c55e' },
  cancelled:  { label: 'Cancelado',  color: '#ef4444' },
  refunded:   { label: 'Reembolsado', color: '#a855f7' },
}

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Pendiente', color: '#f59e0b' },
  paid:     { label: 'Pagado',    color: '#22c55e' },
  failed:   { label: 'Fallido',   color: '#ef4444' },
  refunded: { label: 'Reembolsado', color: '#a855f7' },
  disputed: { label: 'Disputado', color: '#ef4444' },
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return notFound()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status,
      total, subtotal, shipping_cost, tax_amount, tax_rate,
      shipping_method, shipping_address,
      pickup_code, tracking_number, tracking_url,
      customer_name, customer_email, customer_phone,
      created_at, updated_at,
      order_items(id, title, artists, condition, cover_image, price_channel, quantity)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) return notFound()

  const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.created
  const pay = PAYMENT_LABELS[order.payment_status] ?? PAYMENT_LABELS.pending
  const items = (order.order_items ?? []) as any[]
  const shippingAddr = order.shipping_address as any

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link href="/cuenta/pedidos" className="font-meta text-xs" style={{ color: '#F0E040', textDecoration: 'none' }}>← MIS PEDIDOS</Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl" style={{ color: '#FFFFFF' }}>{order.order_number}</h1>
          <p className="font-meta text-xs mt-1" style={{ color: '#999' }}>
            {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right">
          <span className="font-display text-sm px-3 py-1" style={{ border: `2px solid ${st.color}`, color: st.color }}>{st.label}</span>
          <p className="font-meta text-[0.6rem] mt-2" style={{ color: pay.color }}>Pago: {pay.label}</p>
        </div>
      </div>

      {/* Pickup code */}
      {order.pickup_code && (
        <div className="mb-6 p-4" style={{ border: '2px solid #F0E040', backgroundColor: 'rgba(240,224,64,0.05)' }}>
          <p className="font-meta text-xs" style={{ color: '#999' }}>CÓDIGO DE RECOGIDA</p>
          <p className="font-display text-2xl" style={{ color: '#F0E040', letterSpacing: '0.15em' }}>{order.pickup_code}</p>
        </div>
      )}

      {/* Tracking */}
      {order.tracking_number && (
        <div className="mb-6 p-4" style={{ border: '2px solid #3b82f6', backgroundColor: 'rgba(59,130,246,0.05)' }}>
          <p className="font-meta text-xs" style={{ color: '#999' }}>SEGUIMIENTO</p>
          <p className="font-display text-sm" style={{ color: '#3b82f6' }}>
            {order.tracking_url ? (
              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                {order.tracking_number} →
              </a>
            ) : order.tracking_number}
          </p>
        </div>
      )}

      {/* Items */}
      <section className="mb-8">
        <p className="font-meta text-xs mb-3" style={{ color: '#FFFFFF' }}>DISCOS</p>
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.id} className="flex gap-4 p-3" style={{ border: '1px solid #333' }}>
              <div className="w-14 h-14 shrink-0 relative" style={{ border: '1px solid #333', backgroundColor: '#111' }}>
                {item.cover_image && (
                  <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs" style={{ color: '#FFFFFF' }}>{(item.artists || []).join(', ')}</p>
                <p className="font-display text-xs" style={{ color: '#F0E040' }}>{item.title}</p>
                {item.condition && <p className="font-meta text-[0.6rem] mt-1" style={{ color: '#999' }}>{item.condition}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{Number(item.price_channel).toFixed(2)} €</p>
                {item.quantity > 1 && <p className="font-meta text-[0.6rem]" style={{ color: '#999' }}>×{item.quantity}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Totals */}
      <section className="mb-8 p-4" style={{ border: '2px solid #FFFFFF' }}>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-meta text-xs" style={{ color: '#999' }}>Subtotal</span>
            <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>{Number(order.subtotal).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="font-meta text-xs" style={{ color: '#999' }}>IVA ({(Number(order.tax_rate) * 100).toFixed(0)}%)</span>
            <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>{Number(order.tax_amount).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="font-meta text-xs" style={{ color: '#999' }}>Envío ({order.shipping_method === 'click_collect' ? 'GUARDI (Click&Collect)' : 'Envío a domicilio'})</span>
            <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>{Number(order.shipping_cost).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #333' }}>
            <span className="font-display text-sm" style={{ color: '#FFFFFF' }}>TOTAL</span>
            <span className="font-display text-sm" style={{ color: '#F0E040' }}>{Number(order.total).toFixed(2)} €</span>
          </div>
        </div>
      </section>

      {/* Shipping address */}
      {shippingAddr && (
        <section className="mb-8">
          <p className="font-meta text-xs mb-2" style={{ color: '#FFFFFF' }}>DIRECCIÓN DE ENVÍO</p>
          <div className="p-3" style={{ border: '1px solid #333' }}>
            <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>{order.customer_name}</p>
            <p className="font-meta text-xs" style={{ color: '#999' }}>{shippingAddr.address}</p>
            <p className="font-meta text-xs" style={{ color: '#999' }}>{shippingAddr.postalCode} {shippingAddr.city}{shippingAddr.province ? `, ${shippingAddr.province}` : ''}</p>
            <p className="font-meta text-xs" style={{ color: '#999' }}>{shippingAddr.countryCode}</p>
          </div>
        </section>
      )}
    </div>
  )
}
