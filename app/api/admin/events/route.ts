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
