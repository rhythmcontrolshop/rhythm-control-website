// app/api/admin/sync/route.ts
// Endpoint para sincronizar inventario Discogs → Supabase.
// Autenticación vía cookie rc_admin (SHA256 hash).

import { createAdminClient } from '@/lib/supabase/admin'
import { syncDiscogsInventory } from '@/lib/discogs/sync'
import { createHash } from 'crypto'

const ADMIN_HASH = process.env.ADMIN_SECRET_HASH 
  || createHash('sha256').update(process.env.ADMIN_SECRET || 'rc-admin-2024').digest('hex')

function verifyAdmin(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/rc_admin=([^;]+)/)
  if (!match) return false
  const tokenHash = createHash('sha256').update(match[1]).digest('hex')
  return tokenHash === ADMIN_HASH
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await syncDiscogsInventory()
    return Response.json(result)
  } catch (error: any) {
    console.error('Sync error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
