// app/api/contact/route.ts
// POST — Send contact form via Resend (E2-4: real send instead of mock)

import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  message: z.string().min(1).max(5000),
})

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null)
  if (!raw) return Response.json({ error: 'Payload inválido' }, { status: 400 })

  const parsed = ContactSchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { name, email, message } = parsed.data

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'Rhythm Control <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL ?? 'hola@rhythmcontrolbcn.com',
      subject: `Contacto web: ${name}`,
      replyTo: email,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error('Contact form error:', err)
    return Response.json({ error: 'Error al enviar el mensaje' }, { status: 500 })
  }
}
