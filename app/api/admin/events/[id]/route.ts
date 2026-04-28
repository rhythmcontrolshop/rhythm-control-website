import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdminWithClient()
  if (!check.ok) return NextResponse.json(await check.response.json(), { status: check.response.status })
  const { id } = await params
  const supabase = check.admin
  const body = await req.json()

  // Solo permitir campos válidos
  const allowed = ['date', 'type', 'title', 'venue', 'lineup', 'flyer_url', 'web', 'city', 'country', 'start_time', 'end_time', 'ticket_url', 'description', 'is_featured']
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) filtered[key] = body[key]
  }

  // Normalize type
  if (filtered.type && typeof filtered.type === 'string') {
    const VALID_TYPES = ['dj_set', 'live', 'session', 'all_night', 'release_party', 'in_store', 'other']
    const normalized = (filtered.type as string).toLowerCase().replace(/\s+/g, '_')
    if (!VALID_TYPES.includes(normalized)) {
      return NextResponse.json({ error: `Tipo de evento inválido. Válidos: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }
    filtered.type = normalized
  }

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase.from('events').update(filtered).eq('id', id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdminWithClient()
  if (!check.ok) return NextResponse.json(await check.response.json(), { status: check.response.status })
  const { id } = await params
  const supabase = check.admin
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
