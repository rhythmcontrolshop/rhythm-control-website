// lib/resend.ts
// Módulo de envío de emails con Resend.
// Reemplaza el antiguo lib/whatsapp para todas las notificaciones.
// Usa inicialización lazy para evitar crash en build sin API key.

import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// Email de origen — usar el verificado en Resend
// Hasta verificar dominio: onboarding@resend.dev
// Tras verificar: noreply@rhythmcontrolbcn.com
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

// ─── INTERFACES ──────────────────────────────────────────────────────────────

interface ReservationEmailParams {
  customerName: string
  customerEmail: string
  recordTitle: string
  recordArtist: string
  pickupCode?: string
}

// ─── EMAIL AL CLIENTE ────────────────────────────────────────────────────────

export async function sendReservationEmail({
  customerName,
  customerEmail,
  recordTitle,
  recordArtist,
  pickupCode,
}: ReservationEmailParams) {
  if (!customerEmail) {
    console.warn('sendReservationEmail: sin email del cliente, se omite')
    return { success: false, error: 'No customer email provided' }
  }

  const subject = pickupCode
    ? `Rhythm Control — Tu código de recogida: ${pickupCode}`
    : `Rhythm Control — Reserva confirmada`

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1e293b;">${subject}</h2>
      <p>Hola ${customerName},</p>
      <p>Tu reserva del disco <strong>${recordTitle}</strong> de <strong>${recordArtist}</strong> ha sido confirmada.</p>
      ${pickupCode
        ? `<p style="font-size: 1.5em; font-weight: bold; color: #dc2626; padding: 8px; background: #fef2f2; border-radius: 4px; text-align: center;">Código de recogida: ${pickupCode}</p>
           <p>Presenta este código en tienda para recoger tu disco.</p>
           <p>El disco queda reservado 72 horas. Si no se recoge en ese plazo, volverá al catálogo.</p>`
        : '<p>Pasaremos a reservar el disco en la tienda. Te avisaremos cuando esté listo.</p>'
      }
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="color: #64748b; font-size: 0.85em;">Rhythm Control — Vinilos en Barcelona</p>
    </div>
  `

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: `Rhythm Control <${FROM_EMAIL}>`,
      to: customerEmail,
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Resend exception:', err)
    return { success: false, error: err.message }
  }
}

// ─── NOTIFICACIÓN AL ADMIN ──────────────────────────────────────────────────

export async function sendAdminNotification({
  customerName,
  customerEmail,
  recordTitle,
  recordArtist,
  pickupCode,
}: ReservationEmailParams) {
  const adminEmail = process.env.ADMIN_EMAIL || FROM_EMAIL

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Nueva reserva / Click & Collect</h2>
      <ul>
        <li><strong>Cliente:</strong> ${customerName} (${customerEmail || 'sin email'})</li>
        <li><strong>Disco:</strong> ${recordArtist} — ${recordTitle}</li>
        ${pickupCode ? `<li><strong>Código recogida:</strong> ${pickupCode}</li>` : ''}
      </ul>
    </div>
  `

  try {
    const resend = getResend()
    await resend.emails.send({
      from: `Rhythm Control <${FROM_EMAIL}>`,
      to: adminEmail,
      subject: `Nueva reserva: ${recordArtist} — ${recordTitle}`,
      html,
    })
  } catch (err: any) {
    console.error('Admin notification error:', err)
  }
}

// ─── EMAIL DE CONFIRMACIÓN DE PEDIDO ─────────────────────────────────────────

interface OrderConfirmationParams {
  customerName: string
  customerEmail: string
  orderNumber: string
  items: { artist: string; title: string; price: string }[]
  total: string
  shippingMethod?: string
  pickupCode?: string
}

export async function sendOrderConfirmationEmail({
  customerName,
  customerEmail,
  orderNumber,
  items,
  total,
  shippingMethod,
  pickupCode,
}: OrderConfirmationParams) {
  if (!customerEmail) return { success: false, error: 'No email' }

  const itemsHtml = items.map(i =>
    `<li>${i.artist} — ${i.title}: ${i.price}</li>`
  ).join('')

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Pedido confirmado: ${orderNumber}</h2>
      <p>Hola ${customerName},</p>
      <p>Tu pedido ha sido confirmado y el pago procesado correctamente.</p>
      <h3 style="color: #1e293b;">Artículos:</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: ${total}</strong></p>
      ${pickupCode
        ? `<p style="font-size: 1.5em; font-weight: bold; color: #dc2626; padding: 8px; background: #fef2f2; border-radius: 4px; text-align: center;">Código de recogida: ${pickupCode}</p>
           <p>Presenta este código en tienda para recoger tu pedido.</p>`
        : shippingMethod
          ? `<p>Método de envío: ${shippingMethod}. Recibirás el número de seguimiento cuando se envíe.</p>`
          : ''
      }
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="color: #64748b; font-size: 0.85em;">Rhythm Control — Vinilos en Barcelona</p>
    </div>
  `

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: `Rhythm Control <${FROM_EMAIL}>`,
      to: customerEmail,
      subject: `Rhythm Control — Pedido ${orderNumber} confirmado`,
      html,
    })
    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Order confirmation email error:', err)
    return { success: false, error: err.message }
  }
}
