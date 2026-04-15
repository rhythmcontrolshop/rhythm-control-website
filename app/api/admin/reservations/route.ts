import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
async function requireAdmin() {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  return user
}
export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: 'No autorizado' }, { status: 401 })
  const admin = createAdminClient(); const now = new Date().toISOString()
  const { data: expired } = await admin.from('reservations')
    .update({ status: 'cancelled', cancelled_at: now })
    .eq('status', 'pending').lt('expires_at', now).select('release_id')
  if (expired?.length) {
    const ids = (expired as any[]).map(r => r.release_id).filter(Boolean)
    if (ids.length) await admin.from('releases').update({ status: 'active' }).in('id', ids)
  }
  const { data, error } = await admin.from('reservations')
    .select('id, status, customer_name, customer_phone, customer_email, expires_at, created_at, confirmed_at, cancelled_at, releases(id, title, artists, price, thumb)')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: 'Error al obtener reservas' }, { status: 500 })
  return Response.json(data)
}
export async function PATCH(request: Request) {
  if (!await requireAdmin()) return Response.json({ error: 'No autorizado' }, { status: 401 })
  const { id, action } = await request.json().catch(() => ({}))
  if (!id || !['confirm', 'cancel'].includes(action))
    return Response.json({ error: 'Parámetros inválidos' }, { status: 400 })
  const admin = createAdminClient()
  const { data: r } = await admin.from('reservations').select('release_id, status').eq('id', id).single()
  if (!r || r.status !== 'pending')
    return Response.json({ error: 'Reserva no encontrada o ya procesada' }, { status: 404 })
  const now = new Date().toISOString()
  if (action === 'confirm') {
    await admin.from('reservations').update({ status: 'confirmed', confirmed_at: now }).eq('id', id)
    await admin.from('releases').update({ status: 'sold' }).eq('id', r.release_id)
  } else {
    await admin.from('reservations').update({ status: 'cancelled', cancelled_at: now }).eq('id', id)
    await admin.from('releases').update({ status: 'active' }).eq('id', r.release_id)
  }
  return Response.json({ ok: true })
}
