import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')
  return token === process.env.ADMIN_SECRET
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()
  const { data, error } = await supabase.from('events').update(body).eq('id', id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
