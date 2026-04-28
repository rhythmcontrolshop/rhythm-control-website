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
      <h2 style="color: #1e293b;">Nueva reserva / GUARDI (Click&Collect)</h2>
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

// ─── SHARED EMAIL WRAPPER ──────────────────────────────────────────────────

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #FFFFFF;">
      <!-- Header -->
      <div style="background: #000000; padding: 24px 32px; text-align: center;">
        <h1 style="color: #F0E040; font-size: 18px; letter-spacing: 0.1em; margin: 0;">RHYTHM CONTROL</h1>
        <p style="color: #666666; font-size: 10px; letter-spacing: 0.15em; margin: 4px 0 0 0;">BARCELONA</p>
      </div>
      <!-- Body -->
      <div style="padding: 32px; background: #FFFFFF;">
        <h2 style="color: #000000; font-size: 16px; letter-spacing: 0.04em; margin: 0 0 16px 0;">${title}</h2>
        ${bodyHtml}
      </div>
      <!-- Footer -->
      <div style="background: #F9FAFB; padding: 20px 32px; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 11px; margin: 0;">Rhythm Control S.L. — Barcelona</p>
        <p style="color: #D1D5DB; font-size: 10px; margin: 4px 0 0 0;">Este email fue enviado desde una dirección no monitorizada. No respondas a este correo.</p>
      </div>
    </div>
  `
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

// ─── EMAIL DE RECUPERACIÓN DE CONTRASEÑA ─────────────────────────────────────

interface PasswordResetParams {
  customerEmail: string
  resetLink: string
}

export async function sendPasswordResetEmail({
  customerEmail,
  resetLink,
}: PasswordResetParams) {
  if (!customerEmail) return { success: false, error: 'No email' }

  const bodyHtml = `
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Hola,</p>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Has solicitado restablecer tu contraseña en Rhythm Control.
    </p>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expirará en 1 hora.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetLink}"
         style="background: #F0E040; color: #000000; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 0.06em; display: inline-block;">
        RESTABLECER CONTRASEÑA
      </a>
    </div>
    <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5;">
      Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no cambiará.
    </p>
    <p style="color: #9CA3AF; font-size: 11px; line-height: 1.5;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
      <a href="${resetLink}" style="color: #6B7280; word-break: break-all;">${resetLink}</a>
    </p>
  `

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: `Rhythm Control <${FROM_EMAIL}>`,
      to: customerEmail,
      subject: 'Rhythm Control — Restablecer contraseña',
      html: emailShell('RESTABLECER CONTRASEÑA', bodyHtml),
    })
    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Password reset email error:', err)
    return { success: false, error: err.message }
  }
}

// ─── EMAIL DE BIENVENIDA ────────────────────────────────────────────────────

interface WelcomeParams {
  customerName: string
  customerEmail: string
}

export async function sendWelcomeEmail({
  customerName,
  customerEmail,
}: WelcomeParams) {
  if (!customerEmail) return { success: false, error: 'No email' }

  const bodyHtml = `
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Hola ${customerName},</p>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Bienvenido/a a <strong>Rhythm Control</strong>. Tu cuenta ha sido creada correctamente.
    </p>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Desde tu cuenta puedes:
    </p>
    <ul style="color: #374151; font-size: 14px; line-height: 1.8;">
      <li>Ver y seguir tus pedidos</li>
      <li>Guardar discos en favoritos</li>
      <li>Reservar discos con GUARDI (recogida en tienda)</li>
      <li>Gestionar tus datos de envío</li>
    </ul>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rhythm-control-website.vercel.app'}/cuenta"
         style="background: #F0E040; color: #000000; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 0.06em; display: inline-block;">
        IR A MI CUENTA
      </a>
    </div>
  `

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: `Rhythm Control <${FROM_EMAIL}>`,
      to: customerEmail,
      subject: 'Rhythm Control — Bienvenido/a',
      html: emailShell('BIENVENIDO/A', bodyHtml),
    })
    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Welcome email error:', err)
    return { success: false, error: err.message }
  }
}

// ─── EMAIL DE FACTURA ───────────────────────────────────────────────────────

interface InvoiceEmailParams {
  customerName: string
  customerEmail: string
  invoiceNumber: string
  total: string
  invoiceLink?: string
}

export async function sendInvoiceEmail({
  customerName,
  customerEmail,
  invoiceNumber,
  total,
}: InvoiceEmailParams) {
  if (!customerEmail) return { success: false, error: 'No email' }

  const bodyHtml = `
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Hola ${customerName},</p>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Adjuntamos la factura <strong>${invoiceNumber}</strong> por un importe de <strong>${total}</strong>.
    </p>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Puedes consultar todos tus documentos desde tu cuenta.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rhythm-control-website.vercel.app'}/cuenta/pedidos"
         style="background: #F0E040; color: #000000; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 0.06em; display: inline-block;">
        VER MIS PEDIDOS
      </a>
    </div>
  `

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: `Rhythm Control <${FROM_EMAIL}>`,
      to: customerEmail,
      subject: `Rhythm Control — Factura ${invoiceNumber}`,
      html: emailShell(`FACTURA ${invoiceNumber}`, bodyHtml),
    })
    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Invoice email error:', err)
    return { success: false, error: err.message }
  }
}
