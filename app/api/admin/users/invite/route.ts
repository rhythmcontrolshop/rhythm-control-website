// app/api/admin/users/invite/route.ts
// POST — Create a new user account with admin role (invite team member)

import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const admin = check.admin

  const body = await request.json()
  const { email, password, username, role = 'admin' } = body

  if (!email || !password) {
    return Response.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
  }

  if (password.length < 8) {
    return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const ALLOWED_ROLES = ['customer', 'admin']
  if (!ALLOWED_ROLES.includes(role)) {
    return Response.json({ error: 'Role no válido' }, { status: 400 })
  }

  // Use Supabase admin auth API to create user
  const supabase = createAdminClient()

  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      username: username || email.split('@')[0],
      role,
    },
  })

  if (authError) {
    // If user already exists, just update their role
    if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
      // Find existing user by email
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .single()

      if (existingProfile && existingProfile.role !== role) {
        await admin
          .from('profiles')
          .update({ role })
          .eq('id', existingProfile.id)

        return Response.json({
          ok: true,
          message: `Usuario ${email} ya existía. Rol actualizado a ${role}.`,
          userId: existingProfile.id,
        })
      }

      return Response.json({ error: 'Este email ya está registrado. Cambia el rol del usuario existente.' }, { status: 409 })
    }
    return Response.json({ error: authError.message }, { status: 500 })
  }

  return Response.json({
    ok: true,
    message: `Usuario ${email} creado con rol ${role}`,
    userId: user.user?.id,
  })
}
