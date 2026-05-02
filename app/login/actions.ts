'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'

export async function loginCustomer(formData: FormData) {
  const supabase = await createClient()

  const email    = ((formData.get('email')    as string) ?? '').trim()
  const password =  (formData.get('password') as string) ?? ''

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message ?? ''
    const encodedEmail = encodeURIComponent(email)
    if (msg.includes('Email not confirmed')) {
      redirect(`/login?error=email-no-confirmado&email=${encodedEmail}`)
    }
    if (error.status === 429 || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
      redirect(`/login?error=demasiados-intentos&email=${encodedEmail}`)
    }
    redirect(`/login?error=credenciales-incorrectas&email=${encodedEmail}`)
  }

  revalidatePath('/', 'layout')
  redirect('/cuenta')
}
