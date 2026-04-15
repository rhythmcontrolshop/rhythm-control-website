// app/api/admin/release/[id]/bpm-key/route.ts
// PATCH /api/admin/release/:id/bpm-key — actualiza BPM y tonalidad de un release.

import { createHash }      from 'crypto'
import { cookies }         from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest }  from 'next/server'

function computeAdminToken(secret: string): string {
  return createHash('sha256')
    .update(`${secret}:rc-admin-v1`)
    .digest('hex')
}

async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token  = cookieStore.get('rc_admin')?.value
  const secret = process.env.ADMIN_SECRET
  if (!token || !secret) return false
  return token === computeAdminToken(secret)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body   = await request.json().catch(() => ({}))
  const { bpm, key } = body as { bpm?: number | null; key?: string | null }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('releases')
    .update({ bpm: bpm ?? null, key: key ?? null })
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
