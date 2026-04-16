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
  // Try to expire old reservations
  try {
    const { data: expired } = await admin.from('reservations')
      .update({ status: 'cancelled', cancelled_at: now })
      .eq('status', 'pending').lt('expires_at', now).select('release_id')
    if (expired?.length) {
      const ids = (expired as any[]).map(r => r.release_id).filter(Boolean)
      if (ids.length) await admin.from('releases').update({ status: 'active' }).in('id', ids)
    }
  } catch { /* ignore if cancelled_at column doesn't exist yet */ }

  const { data, error } = await admin.from('reservations')
    .select('id, status, customer_name, customer_phone, customer_email, expires_at, created_at, releases(id, title, artists, price, thumb)')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: 'Error al obtener reservas' }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return Response.json({ error: 'No autorizado' }, { status: 401 })
  const { id, action } = await request.json().catch(() => ({}))
  if (!id || !['confirm', 'collect', 'cancel'].includes(action))
    return Response.json({ error: 'Parámetros inválidos (usar: confirm, collect, cancel)' }, { status: 400 })
  const admin = createAdminClient()
  const { data: r } = await admin.from('reservations').select('release_id, status').eq('id', id).single()
  if (!r) return Response.json({ error: 'Reserva no encontrada' }, { status: 404 })

  if (action === 'confirm' && r.status !== 'pending')
    return Response.json({ error: 'Solo se pueden confirmar reservas pendientes' }, { status: 409 })
  if (action === 'collect' && r.status !== 'confirmed')
    return Response.json({ error: 'Solo se pueden marcar como recogidas las reservas confirmadas' }, { status: 409 })
  if (action === 'cancel' && r.status !== 'pending' && r.status !== 'confirmed')
    return Response.json({ error: 'Solo se pueden cancelar reservas pendientes o confirmadas' }, { status: 409 })

  // Helper: try update with timestamp column, fallback without if column missing
  async function safeUpdate(table: string, data: Record<string, unknown>, timestampField: string | null, id: string) {
    const adminClient = createAdminClient()
    if (timestampField) {
      const withTs = { ...data, [timestampField]: new Date().toISOString() }
      const { error } = await adminClient.from(table).update(withTs).eq('id', id)
      if (!error) return true
      // Column might not exist — retry without timestamp
      console.warn(`Column ${timestampField} may not exist, retrying without it:`, error.message)
    }
    const { error } = await adminClient.from(table).update(data).eq('id', id)
    if (error) {
      console.error(`Update ${table} error:`, error.message)
      return false
    }
    return true
  }

  if (action === 'confirm') {
    const ok = await safeUpdate('reservations', { status: 'confirmed' }, 'confirmed_at', id)
    if (!ok) return Response.json({ error: 'Error al confirmar la reserva' }, { status: 500 })
    await admin.from('releases').update({ status: 'sold' }).eq('id', r.release_id)
  } else if (action === 'collect') {
    const ok = await safeUpdate('reservations', { status: 'collected' }, 'collected_at', id)
    if (!ok) return Response.json({ error: 'Error al marcar como recogida' }, { status: 500 })
    // Release stays 'sold' after collection
  } else {
    // cancel
    const ok = await safeUpdate('reservations', { status: 'cancelled' }, 'cancelled_at', id)
    if (!ok) return Response.json({ error: 'Error al cancelar la reserva' }, { status: 500 })
    await admin.from('releases').update({ status: 'active' }).eq('id', r.release_id)
  }

  return Response.json({ ok: true })
}
