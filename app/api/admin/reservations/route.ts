// app/api/admin/reservations/route.ts
// Admin CRUD for reservations — confirm, collect, cancel

import { requireAdminWithClient } from '@/lib/supabase/require-admin'

export async function PATCH(request: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Payload inválido' }, { status: 400 })

  const { id, action } = body
  if (!id || !action) return Response.json({ error: 'ID y acción requeridos' }, { status: 400 })

  const admin = check.admin
  const now = new Date().toISOString()

  // Get the reservation first
  const { data: reservation, error: fetchError } = await admin
    .from('reservations')
    .select('id, status, release_id')
    .eq('id', id)
    .single()

  if (fetchError || !reservation) {
    return Response.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  if (action === 'confirm') {
    const { error } = await admin
      .from('reservations')
      .update({ status: 'confirmed', updated_at: now })
      .eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true, status: 'confirmed' })
  }

  if (action === 'collect') {
    const { error } = await admin
      .from('reservations')
      .update({ status: 'collected', updated_at: now })
      .eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    // Mark release as sold
    if (reservation.release_id) {
      await admin.from('releases').update({ status: 'sold' }).eq('id', reservation.release_id)
    }
    return Response.json({ ok: true, status: 'collected' })
  }

  if (action === 'cancel') {
    const { error } = await admin
      .from('reservations')
      .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
      .eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    // Return release to active
    if (reservation.release_id) {
      await admin.from('releases').update({ status: 'active' }).eq('id', reservation.release_id)
    }
    return Response.json({ ok: true, status: 'cancelled' })
  }

  return Response.json({ error: 'Acción no reconocida' }, { status: 400 })
}

export async function GET() {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const { data, error } = await check.admin
    .from('reservations')
    .select('id, status, customer_name, customer_phone, customer_email, expires_at, pickup_code, created_at, releases(id, title, artists, thumb)')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}
