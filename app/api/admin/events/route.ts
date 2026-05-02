import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const check = await requireAdminWithClient()
  if (!check.ok) return NextResponse.json(await check.response.json(), { status: check.response.status })
  const supabase = check.admin
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return NextResponse.json(await check.response.json(), { status: check.response.status })
  const supabase = check.admin
  const body = await req.json()

  const VALID_TYPES = ['dj_set', 'live', 'session', 'all_night', 'release_party', 'in_store', 'other']

  // Only allow valid fields — web column added via migration 006
  const allowed = ['date', 'type', 'title', 'venue', 'lineup', 'flyer_url', 'web', 'city', 'country', 'start_time', 'end_time', 'ticket_url', 'description', 'is_featured']
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) filtered[key] = body[key]
  }

  // Normalize type: lowercase, spaces to underscores
  if (filtered.type && typeof filtered.type === 'string') {
    const normalized = (filtered.type as string).toLowerCase().replace(/\s+/g, '_')
    if (!VALID_TYPES.includes(normalized)) {
      return NextResponse.json({ error: `Tipo de evento inválido. Válidos: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }
    filtered.type = normalized
  }

  // Provide defaults for NOT NULL columns if not supplied
  if (!filtered.city) filtered.city = 'Barcelona'
  if (!filtered.country) filtered.country = 'ES'
  if (!filtered.start_time) filtered.start_time = '20:00'

  const { data, error } = await supabase.from('events').insert([filtered]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
