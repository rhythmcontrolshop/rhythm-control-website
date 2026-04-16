import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  created:    { label: 'CREADO',      color: '#6b7280', bg: '#f3f4f6' },
  processing: { label: 'PROCESANDO',  color: '#d97706', bg: '#fffbeb' },
  paid:       { label: 'PAGADO',      color: '#059669', bg: '#ecfdf5' },
  shipped:    { label: 'ENVIADO',     color: '#2563eb', bg: '#eff6ff' },
  delivered:  { label: 'ENTREGADO',   color: '#16a34a', bg: '#f0fdf4' },
  collected:  { label: 'RECOGIDO',    color: '#16a34a', bg: '#f0fdf4' },
  cancelled:  { label: 'CANCELADO',   color: '#dc2626', bg: '#fef2f2' },
  pending:    { label: 'PENDIENTE',   color: '#d97706', bg: '#fffbeb' },
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select('id, order_number, user_id, total, status, payment_status, shipping_method, shipping_address, pickup_code, tracking_code, tracking_carrier, tracking_url, created_at, metadata')
    .eq('id', params.id)
    .single()

  if (error || !order) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <Link href="/admin/orders" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
          <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>PEDIDO NO ENCONTRADO</h1>
          <div />
        </div>
        <div className="p-4" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-sm" style={{ color: '#ef4444' }}>No se encontró el pedido {params.id}</p>
        </div>
      </div>
    )
  }

  // Get customer profile
  let customer: any = null
  if (order.user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, username, first_name, last_name, phone, address, city, postal_code, country')
      .eq('id', order.user_id)
      .single()
    customer = profile
  }

  // Parse order items from metadata
  const items: any[] = (order as any).metadata?.items ?? []
  const shippingAddr = order.shipping_address ?? (customer ? {
    address: customer.address,
    city: customer.city,
    postal_code: customer.postal_code,
    country: customer.country,
  } : null)

  const orderSt = STATUS[order.status ?? 'created'] ?? STATUS.created
  const paymentSt = STATUS[order.payment_status ?? 'pending'] ?? STATUS.pending

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin/orders" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
        <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>PEDIDO {order.order_number || order.id.slice(0, 8)}</h1>
        <span className="text-xs px-3 py-1" style={{ color: orderSt.color, border: `1px solid ${orderSt.color}`, backgroundColor: orderSt.bg }}>{orderSt.label}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Customer info */}
        <div className="md:col-span-1 space-y-6">
          {customer && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>CLIENTE</h3>
              <p className="text-sm font-bold" style={{ color: '#000000' }}>
                {customer.first_name && customer.last_name ? `${customer.first_name} ${customer.last_name}` : customer.username || '—'}
              </p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{customer.email}</p>
              {customer.phone && <p className="text-xs" style={{ color: '#6b7280' }}>{customer.phone}</p>}
            </div>
          )}

          {shippingAddr && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>DIRECCIÓN DE ENVÍO</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>
                {(shippingAddr as any).address || ''}<br />
                {(shippingAddr as any).postal_code || ''} {(shippingAddr as any).city || ''}<br />
                {(shippingAddr as any).country || ''}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>PAGO</h3>
            <span className="text-xs px-2 py-1" style={{ color: paymentSt.color, border: `1px solid ${paymentSt.color}`, backgroundColor: paymentSt.bg }}>
              {paymentSt.label}
            </span>
          </div>

          {order.pickup_code && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>CÓDIGO DE RECOGIDA</h3>
              <p className="font-display text-xl" style={{ color: '#000000', letterSpacing: '0.1em' }}>{order.pickup_code}</p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>MÉTODO DE ENVÍO</h3>
            <p className="text-xs" style={{ color: '#374151' }}>
              {order.shipping_method === 'click_collect' ? 'GUARDI (Click & Collect)' :
               order.shipping_method === 'home_delivery' ? 'Envío a domicilio' :
               order.shipping_method ?? '—'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>FECHA</h3>
            <p className="text-xs" style={{ color: '#374151' }}>
              {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Right column: Items + Tracking */}
        <div className="md:col-span-2 space-y-8">
          {items.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-4" style={{ color: '#6b7280' }}>ARTÍCULOS</h3>
              <div style={{ border: '1px solid #d1d5db' }}>
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-12 h-12 object-cover" style={{ border: '1px solid #d1d5db' }} />
                    ) : (
                      <div className="w-12 h-12" style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase truncate" style={{ color: '#000000' }}>{item.artists?.[0] ?? '—'}</p>
                      <p className="text-xs truncate" style={{ color: '#6b7280' }}>{item.title}</p>
                    </div>
                    <p className="text-sm" style={{ color: '#000000' }}>{Number(item.price).toFixed(2)} €</p>
                  </div>
                ))}
                <div className="p-3 text-right" style={{ backgroundColor: '#f9fafb' }}>
                  <p className="text-lg font-bold" style={{ color: '#000000' }}>TOTAL: {Number(order.total).toFixed(2)} €</p>
                </div>
              </div>
            </div>
          )}

          {order.tracking_code && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>
                SEGUIMIENTO {order.tracking_carrier || ''}
              </h3>
              {order.tracking_url ? (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline block mb-2" style={{ color: '#2563eb' }}>
                  CÓDIGO: {order.tracking_code} → VER EN WEB
                </a>
              ) : (
                <p className="text-xs" style={{ color: '#374151' }}>CÓDIGO: {order.tracking_code}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
