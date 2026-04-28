// app/api/admin/bootstrap/route.ts
// POST — Create the FIRST admin user (only works when no admin exists)
// This endpoint bypasses requireAdmin check — it's the bootstrap mechanism.

import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const admin = createAdminClient()

  // ── Step 1: Check if any admin already exists ──
  const { data: existingAdmins, error: checkError } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)

  if (checkError) {
    return Response.json({ error: 'Error al verificar administradores existentes' }, { status: 500 })
  }

  if (existingAdmins && existingAdmins.length > 0) {
    return Response.json(
      { error: 'Ya existe un administrador. Usa el panel de Equipo para gestionar miembros.' },
      { status: 403 }
    )
  }

  // ── Step 2: Validate input ──
  const body = await request.json()
  const { email, password, username } = body

  if (!email || !password) {
    return Response.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
  }

  if (password.length < 8) {
    return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  // ── Step 3: Create user via Supabase Admin API ──
  const { data: user, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: username || email.split('@')[0],
    },
  })

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
      // User exists — just update their role to admin
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .single()

      if (existingProfile) {
        if (existingProfile.role === 'admin') {
          return Response.json({ ok: true, message: 'Este usuario ya es administrador.' }, { status: 200 })
        }
        const { error: updateError } = await admin
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', existingProfile.id)

        if (updateError) {
          return Response.json({ error: 'Error al actualizar el rol' }, { status: 500 })
        }
        return Response.json({
          ok: true,
          message: `Usuario ${email} ya existía. Rol actualizado a admin. Ya puedes iniciar sesión.`,
        })
      }
      return Response.json({ error: 'Este email ya está registrado pero no se encontró el perfil.' }, { status: 409 })
    }
    return Response.json({ error: authError.message }, { status: 500 })
  }

  // ── Step 4: Ensure profile has admin role ──
  // The trigger creates profile with role='customer' (or from metadata).
  // Force update to admin.
  if (user.user) {
    await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.user.id)
  }

  return Response.json({
    ok: true,
    message: `Admin ${email} creado correctamente. Ya puedes iniciar sesión en /admin/login.`,
    userId: user.user?.id,
  })
}
