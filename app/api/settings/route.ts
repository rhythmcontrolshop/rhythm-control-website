// app/api/settings/route.ts
// Public read-only access to site settings (no auth required)

import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') // optional filter

  const supabase = await createClient()
  let query = supabase.from('site_settings').select('key, value, category')

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Return as a flat key→value map for easy consumption
  const map: Record<string, any> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value
  }

  return Response.json(map)
}
