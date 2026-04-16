import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  return user
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = createAdminClient()
  const body = await req.json()

  // Solo permitir campos válidos
  const allowed = ['date', 'type', 'title', 'venue', 'lineup', 'flyer_url', 'web']
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) filtered[key] = body[key]
  }

  const { data, error } = await supabase.from('events').insert([filtered]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
