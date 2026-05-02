'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/resend'

export async function recoverPassword(formData: FormData) {
  const supabase = await createClient()

  const email = ((formData.get('email') as string) ?? '').trim()

  if (!email) {
    redirect('/admin/recover?error=missing-email')
  }

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    redirect('/admin/recover?error=misconfigured')
  }
  // Ensure protocol prefix — without it Supabase treats it as a relative path
  if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
    siteUrl = `https://${siteUrl}`
  }
  siteUrl = siteUrl.replace(/\/+$/, '') // strip trailing slashes

  // ── Generate recovery link via Supabase Admin API ──
  // This gives us the link that Supabase would normally email,
  // but we send it ourselves via Resend with RC branding.
  const admin = createAdminClient()
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${siteUrl}/admin/reset-password`,
    },
  })

  if (linkError || !linkData) {
    console.error('generateLink error:', linkError)
    // Don't reveal whether the email exists — always show success
    redirect('/admin/recover?success=true')
  }

  // The generated link contains the PKCE code or hash fragment
  const resetLink = linkData.properties?.action_link || ''

  if (!resetLink) {
    console.error('No action_link in generateLink response')
    redirect('/admin/recover?success=true')
  }

  // ── Send via Resend with RC branding ──
  const result = await sendPasswordResetEmail({
    customerEmail: email,
    resetLink,
  })

  if (!result.success) {
    console.error('Resend password reset email failed:', result.error)
    // Fallback: try Supabase's built-in email as backup
    const { error: fallbackError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/admin/reset-password`,
    })
    if (fallbackError) {
      redirect('/admin/recover?error=send-failed')
    }
  }

  // Always show success to prevent email enumeration
  redirect('/admin/recover?success=true')
}
