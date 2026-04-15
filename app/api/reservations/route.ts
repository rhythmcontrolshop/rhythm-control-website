import { createAdminClient }    from '@/lib/supabase/admin'
import { sendReservationAlert } from '@/lib/whatsapp'
import { checkRateLimit }    from '@/lib/rate-limit'
export async function POST(request: Request) {
  // Rate limiting por IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
          || request.headers.get('x-real-ip') 
          || 'unknown'
  const rate = checkRateLimit(ip)
  if (!rate.allowed) {
    return Response.json({ 
      error: `Demasiadas reservas. Espera ${Math.ceil(rate.resetIn / 60000)} minutos.` 
    }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Payload inválido' }, { status: 400 })
  const { release_id, customer_name, customer_phone, customer_email } = body
  if (!release_id || !customer_name?.trim() || !customer_phone?.trim())
    return Response.json({ error: 'Nombre y teléfono son obligatorios' }, { status: 400 })
  const supabase = createAdminClient()
  const { data: release } = await supabase
    .from('releases').select('id, title, artists, status').eq('id', release_id).single()
  if (!release || release.status !== 'active')
    return Response.json({ error: 'Este disco no está disponible' }, { status: 409 })
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({ release_id, customer_name: customer_name.trim(),
              customer_phone: customer_phone.trim(),
              customer_email: customer_email?.trim() || null, expires_at })
    .select('id').single()
  if (error) return Response.json({ error: 'No se pudo crear la reserva' }, { status: 500 })
  await supabase.from('releases').update({ status: 'reserved' }).eq('id', release_id)
  sendReservationAlert({ artistName: release.artists[0] ?? '—', releaseName: release.title,
    customerName: customer_name.trim(), customerPhone: customer_phone.trim(),
    expiresAt: new Date(expires_at) })
  return Response.json({ ok: true, reservation_id: reservation.id }, { status: 201 })
}
