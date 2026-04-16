import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  return user
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()

  // Solo permitir campos válidos
  const allowed = ['date', 'type', 'title', 'venue', 'lineup', 'flyer_url', 'web']
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) filtered[key] = body[key]
  }

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase.from('events').update(filtered).eq('id', id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
