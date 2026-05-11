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

  // Profile field update: { id, full_name?, phone?, address?, city?, postal_code? }
  if ('id' in body && !('role' in body)) {
    const { id, full_name, phone, address, city, postal_code } = body

    if (!id) return Response.json({ error: 'id es requerido' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (phone !== undefined) updates.phone = phone
    if (address !== undefined) updates.address = address
    if (city !== undefined) updates.city = city
    if (postal_code !== undefined) updates.postal_code = postal_code

    const { data, error } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('id, full_name, phone, address, city, postal_code, email')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  }

  // Role update: { userId, role }
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
