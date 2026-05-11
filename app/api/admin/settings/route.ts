// app/api/admin/settings/route.ts
// CRUD for site_settings — admin only

import { requireAdminWithClient } from '@/lib/supabase/require-admin'

export async function GET() {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const admin = check.admin

  const { data, error } = await admin
    .from('site_settings')
    .select('key, value, category, label, updated_at')
    .order('category', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(req: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const admin = check.admin
  const body = await req.json()

  // Expect { settings: [{ key, value }, ...] }
  if (!Array.isArray(body.settings)) {
    return Response.json({ error: 'Formato inválido. Esperado { settings: [...] }' }, { status: 400 })
  }

  const results = []
  for (const item of body.settings) {
    if (!item.key || item.value === undefined) continue

    const { data, error } = await admin
      .from('site_settings')
      .update({ value: item.value, updated_at: new Date().toISOString() })
      .eq('key', item.key)
      .select()
      .single()

    if (error) {
      results.push({ key: item.key, error: error.message })
    } else {
      results.push({ key: item.key, ok: true })
    }
  }

  return Response.json({ updated: results })
}
