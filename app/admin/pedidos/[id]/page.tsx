'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  created:    { label: 'CREADO',      color: '#6b7280' },
  pending:    { label: 'PENDIENTE',   color: '#f59e0b' },
  paid:       { label: 'PAGADO',      color: '#22c55e' },
  confirmed:  { label: 'CONFIRMADO',  color: '#22c55e' },
  processing: { label: 'PREPARANDO',  color: '#3b82f6' },
  shipped:    { label: 'ENVIADO',     color: '#8b5cf6' },
  delivered:  { label: 'ENTREGADO',   color: '#10b981' },
  collected:  { label: 'RECOGIDO',    color: '#10b981' },
  cancelled:  { label: 'CANCELADO',   color: '#ef4444' },
  refunded:   { label: 'REEMBOLSADO', color: '#9ca3af' },
}

const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  created:    [{ value: 'confirmed', label: 'CONFIRMAR' }],
  pending:    [{ value: 'confirmed', label: 'CONFIRMAR' }],
  paid:       [{ value: 'confirmed', label: 'CONFIRMAR' }, { value: 'processing', label: 'PREPARAR' }],
  confirmed:  [{ value: 'processing', label: 'PREPARAR' }, { value: 'collected', label: 'RECOGIDO' }],
  processing: [{ value: 'shipped', label: 'ENVIAR' }, { value: 'collected', label: 'RECOGIDO' }],
  shipped:    [{ value: 'delivered', label: 'ENTREGADO' }],
}

interface OrderItem {
  id: string; release_id: string; title: string; artist: string
  artists: string[]; condition: string; price: number; price_base: number
  price_channel: number; quantity: number; thumb: string; cover_image: string
}

interface TimelineEvent {
  id: string; order_id: string; event_type: string; description: string; created_at: string
}

interface Order {
  id: string; order_number: string; status: string; payment_status: string
  fulfillment_type: string; shipping_method: string | null
  customer_name: string; customer_email: string; customer_phone: string
  shipping_address: any; pickup_code: string
  total_amount: number; subtotal: number; shipping_cost: number; tax_amount: number; tax_rate: number
  stripe_payment_intent: string; stripe_checkout_session_id: string
  tracking_number: string; notes: string
  price_channel: string
  created_at: string; updated_at: string
  order_items: OrderItem[]
  order_timeline?: TimelineEvent[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder]             = useState<Order | null>(null)
  const [loading, setLoading]         = useState(true)
  const [updating, setUpdating]       = useState(false)
  const [trackingInput, setTracking]  = useState('')
  const [notesInput, setNotes]        = useState('')
  const [savingTracking, setSavingTracking] = useState(false)
  const [savingNotes, setSavingNotes]       = useState(false)
  const [showRefundConfirm, setShowRefund]  = useState(false)

  useEffect(() => {
    async function fetchOrder() {
      const res = await fetch(`/api/admin/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        setTracking(data.tracking_number ?? '')
        setNotes(data.notes ?? '')
      }
      setLoading(false)
    }
    fetchOrder()
  }, [params.id])

  async function refreshOrder() {
    const res = await fetch(`/api/admin/orders/${params.id}`)
    if (res.ok) setOrder(await res.json())
  }

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) await refreshOrder()
    else alert('Error al actualizar estado')
    setUpdating(false)
  }

  async function cancelOrder() {
    if (!confirm('Cancelar este pedido? El vinilo volvera a estar en venta.')) return
    setUpdating(true)
    await updateStatus('cancelled')
    setUpdating(false)
  }

  async function saveTracking() {
    setSavingTracking(true)
    const res = await fetch(`/api/admin/orders/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_number: trackingInput }),
    })
    if (res.ok) await refreshOrder()
    else alert('Error al guardar tracking')
    setSavingTracking(false)
  }

  async function saveNotes() {
    setSavingNotes(true)
    const res = await fetch(`/api/admin/orders/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesInput }),
    })
    if (res.ok) await refreshOrder()
    else alert('Error al guardar notas')
    setSavingNotes(false)
  }

  async function refundOrder() {
    if (!confirm('Procesar reembolso via Stripe? Esta accion es irreversible.')) return
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${params.id}/refund`, { method: 'POST' })
    if (res.ok) {
      await refreshOrder()
      setShowRefund(false)
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Error al procesar reembolso')
    }
    setUpdating(false)
  }

  if (loading) return <p className="text-xs animate-pulse p-6" style={{ color: '#6b7280' }}>CARGANDO...</p>
  if (!order) return <p className="text-sm p-6" style={{ color: '#ef4444' }}>Pedido no encontrado</p>

  const st = STATUS_MAP[order.status] ?? STATUS_MAP.pending
  const nextActions = NEXT_STATUS[order.status] ?? []
  const isPickup = order.fulfillment_type === 'pickup'
  const isShipped = order.status === 'shipped'
  const isTerminal = ['cancelled', 'refunded', 'delivered', 'collected'].includes(order.status)

  // Timeline construido desde los datos disponibles
  const timeline = buildTimeline(order)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <div className="flex items-center gap-4">
          <Link href="/admin/pedidos" className="text-xs hover:underline" style={{ color: '#6b7280' }}>
            &larr; PEDIDOS
          </Link>
          <h1 className="text-xl font-bold" style={{ color: '#000000' }}>
            PEDIDO #{order.order_number ?? order.id.slice(0, 8)}
          </h1>
          <span className="text-xs px-2 py-1" style={{ color: st.color, border: `1px solid ${st.color}` }}>
            {st.label}
          </span>
        </div>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Grid principal: 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Columna izquierda (2/3): Items + Timeline + Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: '#6b7280' }}>ARTICULOS</p>
            <div style={{ border: '1px solid #d1d5db' }}>
              {(order.order_items ?? []).map((item, i) => (
                <div key={item.id} className="flex items-center gap-4 p-4"
                  style={{ borderBottom: i < (order.order_items?.length ?? 0) - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  {item.cover_image || item.thumb
                    ? <img src={item.cover_image || item.thumb} alt="" className="w-14 h-14 object-cover shrink-0" style={{ border: '1px solid #d1d5db' }} />
                    : <div className="w-14 h-14 shrink-0" style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#000000' }}>
                      {item.artist || item.artists?.[0] || '—'}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#6b7280' }}>{item.title}</p>
                    {item.condition && <p className="text-xs" style={{ color: '#9ca3af' }}>{item.condition}</p>}
                  </div>
                  <p className="text-sm font-bold shrink-0" style={{ color: '#000000' }}>
                    {((item.price || item.price_channel || 0) / 100).toFixed(2)} EUR
                  </p>
                </div>
              ))}
              <div className="p-4 space-y-2" style={{ borderTop: '2px solid #000000' }}>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6b7280' }}>Subtotal</span>
                  <span className="text-xs" style={{ color: '#000000' }}>
                    {((order.subtotal || (order.total_amount - order.shipping_cost) || 0) / 100).toFixed(2)} EUR
                  </span>
                </div>
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: '#6b7280' }}>Envio</span>
                    <span className="text-xs" style={{ color: '#000000' }}>
                      {(order.shipping_cost / 100).toFixed(2)} EUR
                    </span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: '#6b7280' }}>IVA ({((order.tax_rate || 0.21) * 100).toFixed(0)}%)</span>
                    <span className="text-xs" style={{ color: '#000000' }}>
                      {(order.tax_amount / 100).toFixed(2)} EUR
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>
                  <span className="text-sm font-bold" style={{ color: '#000000' }}>TOTAL</span>
                  <span className="text-sm font-bold" style={{ color: '#000000' }}>
                    {((order.total_amount ?? 0) / 100).toFixed(2)} EUR
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking (solo para envios) */}
          {!isPickup && (
            <div>
              <p className="text-xs font-medium mb-3" style={{ color: '#6b7280' }}>SEGUIMIENTO</p>
              <div className="p-4" style={{ border: '1px solid #d1d5db' }}>
                <div className="flex gap-3">
                  <input type="text" value={trackingInput} onChange={e => setTracking(e.target.value)}
                    placeholder="Numero de tracking (ej. TIPS123456789ES)"
                    className="flex-1 text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }} />
                  <button onClick={saveTracking} disabled={savingTracking}
                    className="text-xs px-4 py-2 transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
                    {savingTracking ? '...' : 'GUARDAR'}
                  </button>
                </div>
                {order.tracking_number && (
                  <p className="text-xs mt-3" style={{ color: '#6b7280' }}>
                    Tracking guardado: <span className="font-mono font-bold" style={{ color: '#000000' }}>{order.tracking_number}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: '#6b7280' }}>HISTORIAL</p>
            <div className="pl-4 space-y-4" style={{ borderLeft: '2px solid #000000' }}>
              {timeline.map((evt, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: i === 0 ? '#000000' : '#d1d5db', border: '2px solid #FFFFFF' }} />
                  <p className="text-xs font-medium" style={{ color: '#000000' }}>{evt.label}</p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{evt.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha (1/3): Info + Acciones */}
        <div className="space-y-6">
          {/* Cliente */}
          <div className="p-5" style={{ border: '1px solid #d1d5db' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#6b7280' }}>CLIENTE</p>
            <p className="text-sm font-bold" style={{ color: '#000000' }}>{order.customer_name || '—'}</p>
            {order.customer_email && <p className="text-xs" style={{ color: '#6b7280' }}>{order.customer_email}</p>}
            {order.customer_phone && <p className="text-xs" style={{ color: '#6b7280' }}>{order.customer_phone}</p>}
            {order.shipping_address && typeof order.shipping_address === 'object' && !isPickup && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>DIRECCION</p>
                <p className="text-xs leading-relaxed" style={{ color: '#000000' }}>
                  {(order.shipping_address as any).line1 && <>{(order.shipping_address as any).line1}<br /></>}
                  {(order.shipping_address as any).city && <>{(order.shipping_address as any).city}</>}
                  {(order.shipping_address as any).postal_code && <>, {(order.shipping_address as any).postal_code}</>}
                  {(order.shipping_address as any).country && <><br />{(order.shipping_address as any).country}</>}
                </p>
              </div>
            )}
          </div>

          {/* Info pedido */}
          <div className="p-5" style={{ border: '1px solid #d1d5db' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#6b7280' }}>INFORMACION</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: '#6b7280' }}>Tipo</p>
                <p className="text-sm font-bold" style={{ color: '#000000' }}>
                  {isPickup ? 'GUARDI (Click & Collect)' : 'ENVIO'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#6b7280' }}>Pago</p>
                <p className="text-sm font-bold"
                  style={{ color: order.payment_status === 'paid' ? '#22c55e' : '#f59e0b' }}>
                  {order.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                </p>
              </div>
              {order.price_channel && (
                <div>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Canal</p>
                  <p className="text-sm font-bold" style={{ color: '#000000' }}>
                    {order.price_channel.toUpperCase()}
                  </p>
                </div>
              )}
              {order.pickup_code && (
                <div>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Codigo recogida</p>
                  <p className="text-lg font-mono font-bold" style={{ color: '#000000' }}>{order.pickup_code}</p>
                </div>
              )}
              {order.stripe_payment_intent && (
                <div>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Stripe PI</p>
                  <p className="text-xs font-mono" style={{ color: '#6b7280' }}>
                    {order.stripe_payment_intent.slice(0, 20)}...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <p className="text-xs font-medium" style={{ color: '#6b7280' }}>ACCIONES</p>
            {nextActions.map(a => (
              <button key={a.value} onClick={() => updateStatus(a.value)} disabled={updating}
                className="w-full text-xs px-6 py-3 transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
                {updating ? 'ACTUALIZANDO...' : a.label}
              </button>
            ))}
            {!isTerminal && (
              <button onClick={cancelOrder} disabled={updating}
                className="w-full text-xs px-6 py-3 transition-colors hover:bg-red-500 hover:text-white"
                style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
                CANCELAR PEDIDO
              </button>
            )}
            {order.payment_status === 'paid' && !isTerminal && order.stripe_payment_intent && (
              <button onClick={() => setShowRefund(true)}
                className="w-full text-xs px-6 py-3 transition-colors hover:opacity-90"
                style={{ border: '1px solid #9ca3af', color: '#6b7280' }}>
                REEMBOLSAR
              </button>
            )}
          </div>

          {/* Notas internas */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>NOTAS INTERNAS</p>
            <textarea value={notesInput} onChange={e => setNotes(e.target.value)}
              placeholder="Notas internas sobre este pedido..."
              rows={3}
              className="w-full text-xs px-3 py-2 focus:outline-none resize-none"
              style={{ border: '1px solid #d1d5db', color: '#000000' }} />
            <button onClick={saveNotes} disabled={savingNotes}
              className="w-full text-xs px-4 py-2 mt-2 transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ border: '1px solid #d1d5db', color: '#374151' }}>
              {savingNotes ? '...' : 'GUARDAR NOTAS'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de reembolso */}
      {showRefundConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="p-6 max-w-sm w-full" style={{ backgroundColor: '#FFFFFF', border: '1px solid #d1d5db' }}>
            <p className="text-sm font-bold mb-2" style={{ color: '#000000' }}>Confirmar reembolso</p>
            <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
              Se procesara un reembolso completo via Stripe. El pedido se marcara como reembolsado y los vinylos volveran a estar en venta.
            </p>
            <div className="flex gap-3">
              <button onClick={refundOrder} disabled={updating}
                className="text-xs px-4 py-2 transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#ef4444', color: '#FFFFFF' }}>
                {updating ? 'PROCESANDO...' : 'REEMBOLSAR'}
              </button>
              <button onClick={() => setShowRefund(false)}
                className="text-xs px-4 py-2 transition-colors hover:bg-gray-100"
                style={{ border: '1px solid #d1d5db', color: '#374151' }}>
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Construir timeline desde datos disponibles del pedido
function buildTimeline(order: Order): { label: string; date: string }[] {
  const events: { label: string; date: string }[] = []

  if (order.created_at) {
    events.push({
      label: `Pedido creado — ${order.fulfillment_type === 'pickup' ? 'GUARDI' : 'ENVIO'}`,
      date: fmtDate(order.created_at),
    })
  }

  if (order.payment_status === 'paid' && order.stripe_payment_intent) {
    events.push({ label: 'Pago confirmado via Stripe', date: fmtDate(order.updated_at) })
  }

  const statusLabels: Record<string, string> = {
    confirmed: 'Pedido confirmado',
    processing: 'Pedido en preparacion',
    shipped: 'Pedido enviado',
    delivered: 'Pedido entregado',
    collected: 'Recogido por el cliente',
    cancelled: 'Pedido cancelado',
    refunded: 'Pedido reembolsado',
  }

  // Si no es created/pending, añadir el estado actual
  if (order.status !== 'created' && order.status !== 'pending' && statusLabels[order.status]) {
    events.push({ label: statusLabels[order.status], date: fmtDate(order.updated_at) })
  }

  if (order.tracking_number) {
    events.push({ label: `Tracking: ${order.tracking_number}`, date: fmtDate(order.updated_at) })
  }

  return events
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
