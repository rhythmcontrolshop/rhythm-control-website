import { Resend } from "resend"

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

interface ReservationEmailParams {
  customerName: string
  customerEmail: string
  recordTitle: string
  recordArtist: string
  pickupCode?: string
}

export async function sendReservationEmail(p: ReservationEmailParams) {
  if (!p.customerEmail) return { success: false, error: "No customer email" }
  const subject = p.pickupCode ? "Rhythm Control — Tu código de recogida: " + p.pickupCode : "Rhythm Control — Reserva confirmada"
  const html = "<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto\"><h2 style=\"color:#1e293b\">" + subject + "</h2><p>Hola " + p.customerName + ",</p><p>Tu reserva de <strong>" + p.recordTitle + "</strong> de <strong>" + p.recordArtist + "</strong> ha sido confirmada.</p>" + (p.pickupCode ? "<p style=\"font-size:1.5em;font-weight:bold;color:#dc2626;padding:8px;background:#fef2f2;border-radius:4px;text-align:center\">Código: " + p.pickupCode + "</p><p>Presenta este código en tienda.</p>" : "<p>Te avisaremos cuando esté listo.</p>") + "<hr style=\"border:none;border-top:1px solid #e2e8f0;margin:16px 0\"/><p style=\"color:#64748b;font-size:0.85em\">Rhythm Control — Vinilos en Barcelona</p></div>"
  try {
    const { data, error } = await getResend().emails.send({ from: "Rhythm Control <" + FROM_EMAIL + ">", to: p.customerEmail, subject, html })
    if (error) { console.error("Resend error:", error); return { success: false, error: error.message } }
    return { success: true, id: data?.id }
  } catch (e: any) { console.error("Resend exception:", e); return { success: false, error: e.message } }
}

export async function sendAdminNotification(p: ReservationEmailParams) {
  const adminEmail = process.env.ADMIN_EMAIL || FROM_EMAIL
  const html = "<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto\"><h2 style=\"color:#1e293b\">Nueva reserva / recogida</h2><ul><li><strong>Cliente:</strong> " + p.customerName + " (" + (p.customerEmail || "sin email") + ")</li><li><strong>Disco:</strong> " + p.recordArtist + " — " + p.recordTitle + "</li>" + (p.pickupCode ? "<li><strong>Código:</strong> " + p.pickupCode + "</li>" : "") + "</ul></div>"
  try { await getResend().emails.send({ from: "Rhythm Control <" + FROM_EMAIL + ">", to: adminEmail, subject: "Nueva reserva: " + p.recordArtist + " — " + p.recordTitle, html }) } catch (e: any) { console.error("Admin notification error:", e) }
}
