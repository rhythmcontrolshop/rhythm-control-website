// app/api/reservations/route.ts
// Click & Collect — Reserva con código de recogida + email vía Resend

import { createAdminClient }    from '@/lib/supabase/admin'
import { sendReservationEmail, sendAdminNotification } from '@/lib/resend'
import { checkRateLimit }       from '@/lib/rate-limit'

function generatePickupCode(): string {
  const num = Math.floor(10000 + Math.random() * 90000)
  return `RC-${num}`
}

export async function POST(request: Request) {
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
  
  if (!customer_email?.trim())
    return Response.json({ error: 'Email es obligatorio para enviar el código de recogida' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: release } = await supabase
    .from('releases').select('id, title, artists, status, price').eq('id', release_id).single()
  
  if (!release || release.status !== 'active')
    return Response.json({ error: 'Este disco no está disponible' }, { status: 409 })

  const pickup_code = generatePickupCode()
  const expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({ 
      release_id, 
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email.trim(), 
      pickup_code,
      expires_at 
    })
    .select('id, pickup_code').single()

  if (error) {
    console.error('Reservation insert error:', error)
    return Response.json({ error: 'No se pudo crear la reserva' }, { status: 500 })
  }

  await supabase.from('releases').update({ status: 'reserved' }).eq('id', release_id)

  const artistName = release.artists?.[0] ?? '—'
  const emailParams = {
    customerName: customer_name.trim(),
    customerEmail: customer_email.trim(),
    recordTitle: release.title,
    recordArtist: artistName,
    pickupCode: pickup_code,
  }

  sendReservationEmail(emailParams).catch(err => 
    console.error('Failed to send customer email:', err)
  )
  sendAdminNotification(emailParams).catch(err => 
    console.error('Failed to send admin notification:', err)
  )

  return Response.json({ 
    ok: true, 
    reservation_id: reservation.id,
    pickup_code: reservation.pickup_code,
  }, { status: 201 })
}
