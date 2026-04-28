// app/api/admin/users/route.ts
// GET — List all users with profiles
// PATCH — Update user role

import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { NextRequest } from 'next/server'

export async function GET() {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const admin = check.admin

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, email, username, full_name, role, created_at')
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ users: profiles ?? [] })
}

export async function PATCH(request: NextRequest) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const admin = check.admin
  const body = await request.json()

  const { userId, role } = body

  if (!userId || !role) {
    return Response.json({ error: 'userId y role son requeridos' }, { status: 400 })
  }

  const ALLOWED_ROLES = ['customer', 'admin']
  if (!ALLOWED_ROLES.includes(role)) {
    return Response.json({ error: 'Role no válido' }, { status: 400 })
  }

  // Prevent self-demotion
  if (userId === check.userId && role !== 'admin') {
    return Response.json({ error: 'No puedes quitarte el rol de admin a ti mismo' }, { status: 400 })
  }

  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, userId, role })
}
