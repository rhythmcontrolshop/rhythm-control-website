// app/api/admin/sync/route.ts
// Trigger Discogs inventory sync — admin only

import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { syncDiscogsInventory } from '@/lib/discogs/sync'

export async function POST() {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  try {
    const { data: runningJob } = await check.admin
      .from('sync_jobs')
      .select('id, status')
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (runningJob) {
      return Response.json(
        { error: 'Ya hay una sincronización en curso. Espera a que termine.' },
        { status: 409 }
      )
    }

    const result = await syncDiscogsInventory()

    return Response.json({
      ok: true,
      synced: result.synced,
      markedSold: result.markedSold,
      error: result.error,
    })
  } catch (err: any) {
    console.error('Sync route error:', err)
    return Response.json(
      { error: 'Error al ejecutar la sincronización', detail: err.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const { data: lastJob } = await check.admin
    .from('sync_jobs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return Response.json({ lastJob })
}
