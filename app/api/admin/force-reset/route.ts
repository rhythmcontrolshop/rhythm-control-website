// app/api/admin/force-reset/route.ts
// POST — Forzar reset de contraseña para un usuario admin
// Solo funciona si no hay ningún admin con acceso válido (situación de emergencia)
// O si se proporciona el ADMIN_SECRET correcto

import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, secret } = body

    // ── Verificación de seguridad ──────────────────────────────────
    // Opción 1: ADMIN_SECRET configurado en env
    // Opción 2: No existe ningún admin que pueda loguearse
    const admin = createAdminClient()
    const adminSecret = process.env.ADMIN_SECRET

    if (!adminSecret) {
      return Response.json({ error: 'ADMIN_SECRET no configurado en el servidor' }, { status: 500 })
    }

    if (secret !== adminSecret) {
      return Response.json({ error: 'Código de seguridad incorrecto' }, { status: 403 })
    }

    if (!email || !password || password.length < 8) {
      return Response.json({ error: 'Email y contraseña (mínimo 8 caracteres) son obligatorios' }, { status: 400 })
    }

    // ── Buscar usuario por email ────────────────────────────────────
    const { data: users, error: listError } = await admin.auth.admin.listUsers()

    if (listError) {
      return Response.json({ error: 'Error al buscar usuarios' }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)

    if (!user) {
      // ── Crear usuario nuevo si no existe ──────────────────────────
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username: email.split('@')[0] },
      })

      if (createError) {
        return Response.json({ error: `Error creando usuario: ${createError.message}` }, { status: 500 })
      }

      // Asignar rol admin
      if (newUser.user) {
        await admin
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', newUser.user.id)
      }

      return Response.json({
        ok: true,
        message: `Usuario ${email} creado como admin. Ya puedes iniciar sesión en /admin/login.`,
        action: 'created',
      })
    }

    // ── Actualizar contraseña del usuario existente ─────────────────
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password,
    })

    if (updateError) {
      return Response.json({ error: `Error actualizando contraseña: ${updateError.message}` }, { status: 500 })
    }

    // ── Asegurar que tiene rol admin ────────────────────────────────
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile && profile.role !== 'admin') {
      await admin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
    }

    return Response.json({
      ok: true,
      message: `Contraseña actualizada para ${email}. Ya puedes iniciar sesión en /admin/login.`,
      action: 'password_reset',
    })

  } catch (err: any) {
    console.error('Force reset error:', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
