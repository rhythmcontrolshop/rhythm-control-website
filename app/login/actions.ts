'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'

export async function loginCustomer(formData: FormData) {
  const supabase = await createClient()

  const email    = ((formData.get('email')    as string) ?? '').trim()
  const password =  (formData.get('password') as string) ?? ''
  const redirectUrl = (formData.get('redirect') as string) ?? '/cuenta'

  if (!email || !password) redirect('/login?error=campos-requeridos')

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=credenciales-incorrectas')

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}
