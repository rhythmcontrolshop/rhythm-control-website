// app/api/admin/release/[id]/bpm-key/route.ts
// PATCH /api/admin/release/:id/bpm-key — actualiza BPM y tonalidad de un release.

import { requireAdminWithClient }  from '@/lib/supabase/require-admin'
import type { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const { id } = await params
  const body   = await request.json().catch(() => ({}))
  const { bpm, key } = body as { bpm?: number | null; key?: string | null }

  const { error } = await check.admin
    .from('releases')
    .update({ bpm: bpm ?? null, key: key ?? null })
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
