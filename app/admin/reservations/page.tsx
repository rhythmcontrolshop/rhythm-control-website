import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'
import ReservationActions    from './ReservationActions'
export const dynamic = 'force-dynamic'
const STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'PENDIENTE',  color: '#f59e0b' },
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
export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const admin = createAdminClient()
  const now   = new Date().toISOString()
  const { data: expired } = await admin.from('reservations')
    .update({ status: 'expired', cancelled_at: now })
    .eq('status', 'pending').lt('expires_at', now).select('release_id')
  if (expired?.length) {
    const ids = (expired as any[]).map(r => r.release_id).filter(Boolean)
    if (ids.length) await admin.from('releases').update({ status: 'active' }).in('id', ids)
  }
  const { data: list } = await admin.from('reservations')
    .select('id, status, customer_name, customer_phone, customer_email, expires_at, pickup_code, created_at, releases(id, title, artists, thumb)')
    .order('created_at', { ascending: false })
  const reservations = (list ?? []) as any[]
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>RESERVAS / CLICK & COLLECT</h1>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          {reservations.filter((r: any) => r.status === 'pending').length} pendiente(s)
        </p>
      </div>
      {reservations.length === 0 && (
        <p className="text-sm" style={{ color: '#6b7280' }}>Sin reservas.</p>
      )}
      {reservations.map((r: any) => {
        const rel  = r.releases as any
        const st   = STATUS[r.status] ?? STATUS.pending
        const left = r.status === 'pending' ? timeLeft(r.expires_at) : null
        return (
          <div key={r.id} className="flex flex-col md:flex-row gap-4 py-4"
            style={{ borderBottom: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-3 flex-1">
              {rel?.thumb
                ? <img src={rel.thumb} alt="" className="w-12 h-12 object-cover shrink-0" style={{ border: '1px solid #d1d5db' }} />
                : <div className="w-12 h-12 shrink-0" style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />}
              <div>
                <p className="text-sm font-bold" style={{ color: '#000000' }}>{rel?.artists?.[0] ?? '—'}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>{rel?.title ?? '—'}</p>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: '#000000' }}>{r.customer_name}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{r.customer_phone}</p>
              {r.customer_email && <p className="text-xs" style={{ color: '#6b7280' }}>{r.customer_email}</p>}
              {r.pickup_code && (
                <p className="text-xs font-mono mt-1 px-2 py-1 inline-block"
                  style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', color: '#000000' }}>
                  {r.pickup_code}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs px-2 py-1"
                  style={{ color: st.color, border: `1px solid ${st.color}` }}>
                  {st.label}
                </span>
                {left && (
                  <p className="text-xs mt-1"
                    style={{ color: left === 'EXPIRADA' ? '#ef4444' : '#f59e0b' }}>{left}</p>
                )}
              </div>
              {(r.status === 'pending' || r.status === 'confirmed') && (
                <ReservationActions reservationId={r.id} status={r.status} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
