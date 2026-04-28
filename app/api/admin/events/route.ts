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

  // Only allow valid fields — web column added via migration 006
  const allowed = ['date', 'type', 'title', 'venue', 'lineup', 'flyer_url', 'web', 'city', 'start_time', 'end_time', 'ticket_url', 'description', 'is_featured']
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) filtered[key] = body[key]
  }

  // Provide defaults for NOT NULL columns if not supplied
  if (!filtered.city) filtered.city = 'Barcelona'
  if (!filtered.start_time) filtered.start_time = '20:00'

  const { data, error } = await supabase.from('events').insert([filtered]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
