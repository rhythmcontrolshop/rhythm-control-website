'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function recoverPassword(formData: FormData) {
  const supabase = await createClient()
  
  const email = ((formData.get('email') as string) ?? '').trim()
  
  if (!email) {
    redirect('/admin/recover?error=missing-email')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    redirect('/admin/recover?error=misconfigured')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/admin/reset-password`,
  })

  if (error) {
    redirect('/admin/recover?error=send-failed')
  }

  redirect('/admin/recover?success=true')
}
