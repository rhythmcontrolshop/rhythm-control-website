// app/api/reservations/route.ts
// Click & Collect — Reserva con código de recogida + email vía Resend
// E1-11: Usa createClient() para verificación y solo admin para inserción

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReservationEmail, sendAdminNotification } from '@/lib/resend'
import { checkRateLimit } from '@/lib/rate-limit'

const ReservationSchema = z.object({
  release_id:     z.string().uuid(),
  customer_name:  z.string().min(1).max(100),
  customer_phone: z.string().min(6).max(25),
  customer_email: z.string().email().max(255),
})

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
      error: `Demasiadas reservas. Espera ${Math.ceil(rate.resetIn / 60000)} minutos.`,
    }, { status: 429 })
  }

  const raw = await request.json().catch(() => null)
  if (!raw) return Response.json({ error: 'Payload inválido' }, { status: 400 })

  const parsed = ReservationSchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return Response.json({ error: message }, { status: 400 })
  }

  const { release_id, customer_name, customer_phone, customer_email } = parsed.data

  // E1-11: Usar createClient() (respeta RLS) para verificación de lectura
  const supabaseRead = await createClient()
  const { data: release } = await supabaseRead
    .from('releases')
    .select('id, title, artists, status, price')
    .eq('id', release_id)
    .single()

  if (!release || release.status !== 'active') {
    return Response.json({ error: 'Este disco no está disponible' }, { status: 409 })
  }

  // Usar admin solo para las operaciones de escritura (inserción + update status)
  const supabaseAdmin = createAdminClient()

  const pickup_code = generatePickupCode()
  const expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .insert({
      release_id,
      customer_name,
      customer_phone,
      customer_email,
      pickup_code,
      expires_at,
    })
    .select('id, pickup_code')
    .single()

  if (error) {
    console.error('Reservation insert error:', error)
    return Response.json({ error: 'No se pudo crear la reserva' }, { status: 500 })
  }

  await supabaseAdmin.from('releases').update({ status: 'reserved' }).eq('id', release_id)

  const artistName = release.artists?.[0] ?? '—'
  const emailParams = {
    customerName: customer_name,
    customerEmail: customer_email,
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
