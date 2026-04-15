'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (password !== confirmPassword) {
    redirect('/admin/reset-password?error=mismatch')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/admin/reset-password?error=update-failed')
  }

  redirect('/admin/login')
}
