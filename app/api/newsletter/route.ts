// app/api/newsletter/route.ts
// POST — Subscribe email to newsletter via Resend

import { z } from 'zod'

const NewsletterSchema = z.object({
  email: z.string().email().max(255),
})

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null)
  if (!raw) return Response.json({ error: 'Payload inválido' }, { status: 400 })

  const parsed = NewsletterSchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ error: 'Email inválido' }, { status: 400 })
  }

  const { email } = parsed.data

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'Rhythm Control <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL ?? 'hola@rhythmcontrolbcn.com',
      subject: `Newsletter subscription: ${email}`,
      html: `<p>New newsletter subscriber: <strong>${email}</strong></p>`,
    })

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error('Newsletter subscription error:', err)
    return Response.json({ ok: true })
  }
}
