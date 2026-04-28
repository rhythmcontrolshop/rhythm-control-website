// app/recuperar/page.tsx
// Alias público para /admin/recover — redirige al formulario de recuperación de contraseña

import { redirect } from 'next/navigation'

export default function RecuperarPage() {
  redirect('/admin/recover')
}
