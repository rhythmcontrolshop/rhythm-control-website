// app/api/admin/sync/route.ts
// Trigger Discogs inventory sync — admin only

import { createAdminClient } from '@/lib/supabase/admin'
import { syncDiscogsInventory } from '@/lib/discogs/sync'
import type { SyncJob } from '@/types'

export async function POST(request: Request) {
  // Verificar admin via cookie rc_admin
  const cookieHeader = request.headers.get('cookie') || ''
  const adminCookie = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('rc_admin='))

  if (!adminCookie) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const token = adminCookie.split('=')[1]
  const expectedHash = process.env.ADMIN_SECRET
    ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(process.env.ADMIN_SECRET))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
    : ''

  if (token !== expectedHash) {
    // Also check if user has admin role in profiles via Supabase auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  try {
    // Check if there's already a running sync
    const supabase = createAdminClient()
    const { data: runningJob } = await supabase
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

    // Run sync in background — don't await to avoid timeout
    // The sync job itself tracks progress in sync_jobs table
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

export async function GET(request: Request) {
  // Get last sync status
  const supabase = createAdminClient()
  const { data: lastJob } = await supabase
    .from('sync_jobs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return Response.json({ lastJob })
}
