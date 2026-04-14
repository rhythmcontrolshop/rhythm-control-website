import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')
  return token === process.env.ADMIN_SECRET
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const body = await req.json()
  const { data, error } = await supabase.from('events').insert([body]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
