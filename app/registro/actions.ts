'use server'

import { redirect }       from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient }   from '@/lib/supabase/server'

export async function registerCustomer(formData: FormData) {
  const supabase = await createClient()

  const email    = ((formData.get('email')    as string) ?? '').trim()
  const password =  (formData.get('password') as string) ?? ''
  const username = ((formData.get('username') as string) ?? '').trim() || null

  if (!email || !password) redirect('/registro?error=campos-requeridos')
  if (password.length < 6) redirect('/registro?error=password-corto')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      }
    }
  })

  if (error) {
    if (error.message.includes('already registered')) {
      redirect('/registro?error=email-existe')
    }
    redirect('/registro?error=unknown')
  }

  // El trigger en Supabase crea el perfil automáticamente
  revalidatePath('/', 'layout')
  redirect('/cuenta?welcome=true')
}
