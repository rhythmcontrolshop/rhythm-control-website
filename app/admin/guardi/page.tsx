import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'
import GuardiActions         from './GuardiActions'
export const dynamic = 'force-dynamic'

const STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'PENDIENTE',  color: '#f59e0b' },
  paid:      { label: 'PAGADO',     color: '#22c55e' },
  confirmed: { label: 'CONFIRMADA', color: '#22c55e' },
  collected: { label: 'RECOGIDA',   color: '#3b82f6' },
  cancelled: { label: 'CANCELADA',  color: '#ef4444' },
  expired:   { label: 'EXPIRADA',   color: '#9ca3af' },
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'EXPIRADA'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}

export default async function GuardiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()
  const now   = new Date().toISOString()

  // Auto-expirar reservas pendientes
  const { data: expired } = await admin.from('reservations')
    .update({ status: 'expired', cancelled_at: now })
    .eq('status', 'pending').lt('expires_at', now).select('release_id')
  if (expired?.length) {
    const ids = (expired as any[]).map(r => r.release_id).filter(Boolean)
    if (ids.length) await admin.from('releases').update({ status: 'active' }).in('id', ids)
  }

  // Cargar reservas y orders con pickup_code
  const [resReservations, resOrders] = await Promise.all([
    admin.from('reservations')
      .select('id, status, customer_name, customer_phone, customer_email, expires_at, pickup_code, created_at, releases(id, title, artists, thumb)')
      .order('created_at', { ascending: false }),
    admin.from('orders')
      .select('id, order_number, status, customer_name, customer_email, pickup_code, created_at, total_amount')
      .eq('fulfillment_type', 'pickup')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const reservations = (resReservations.data ?? []) as any[]
  const pickupOrders = (resOrders.data ?? []) as any[]

  // Combinar: orders con pickup_code primero, luego reservas legacy
  const allItems = [
    ...pickupOrders.map((o: any) => ({ type: 'order' as const, ...o })),
    ...reservations.map((r: any) => ({ type: 'reservation' as const, ...r, order_number: null, total_amount: null })),
  ]

  const pendingCount = allItems.filter((i: any) =>
    i.status === 'pending' || i.status === 'paid' || i.status === 'confirmed'
  ).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold" style={{ color: '#000000' }}>GUARDI</h1>
          <span className="text-xs px-2 py-1" style={{ color: '#6b7280', border: '1px solid #d1d5db' }}>
            CLICK & COLLECT
          </span>
        </div>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          {pendingCount} pendiente(s)
        </p>
      </div>

      {allItems.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: '#6b7280' }}>Sin recogidas pendientes.</p>
          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
            Cuando un cliente reserve y pague, aparecera aqui con su codigo de recogida.
          </p>
        </div>
      )}

      {allItems.map((item: any) => {
        const isOrder = item.type === 'order'
        const st = STATUS[item.status] ?? STATUS.pending
        const left = item.status === 'pending' ? timeLeft(item.expires_at) : null

        // Para orders: mostrar datos del pedido; para reservas: datos del release
        const title = isOrder ? `Pedido #${item.order_number ?? item.id?.slice(0,8)}` : (item.releases as any)?.title ?? '—'
        const subtitle = isOrder
          ? `${item.total_amount ? (item.total_amount / 100).toFixed(2) + ' EUR' : ''}`
          : (item.releases as any)?.artists?.[0] ?? '—'

        return (
          <div key={`${item.type}-${item.id}`} className="flex flex-col md:flex-row gap-4 py-4"
            style={{ borderBottom: '1px solid #e5e7eb' }}>

            {/* Imagen + Info */}
            <div className="flex items-center gap-3 flex-1">
              {!isOrder && (item.releases as any)?.thumb
                ? <img src={(item.releases as any).thumb} alt="" className="w-12 h-12 object-cover shrink-0" style={{ border: '1px solid #d1d5db' }} />
                : <div className="w-12 h-12 shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>{isOrder ? 'PED' : 'RES'}</span>
                  </div>
              }
              <div>
                <p className="text-sm font-bold" style={{ color: '#000000' }}>{title}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>{subtitle}</p>
              </div>
            </div>

            {/* Cliente */}
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: '#000000' }}>{item.customer_name ?? '—'}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{item.customer_phone ?? item.customer_email ?? ''}</p>
              {item.pickup_code && (
                <p className="text-xs font-mono mt-1 px-2 py-1 inline-block"
                  style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', color: '#000000' }}>
                  {item.pickup_code}
                </p>
              )}
            </div>

            {/* Estado + Acciones */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs px-2 py-1"
                  style={{ color: st.color, border: `1px solid ${st.color}` }}>
                  {st.label}
                </span>
                {left && (
                  <p className="text-xs mt-1" style={{ color: left === 'EXPIRADA' ? '#ef4444' : '#f59e0b' }}>{left}</p>
                )}
              </div>
              {!isOrder && (item.status === 'pending' || item.status === 'confirmed') && (
                <GuardiActions reservationId={item.id} status={item.status} />
              )}
              {isOrder && (item.status === 'paid' || item.status === 'confirmed') && (
                <GuardiActions orderId={item.id} status={item.status} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
