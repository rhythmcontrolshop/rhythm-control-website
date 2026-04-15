// app/api/sync/discogs/route.ts
// POST /api/sync/discogs — endpoint para Vercel Cron Job.
// Autenticación via header Authorization: Bearer CRON_SECRET
//
// Configurar en vercel.json:
// {
//   "crons": [{ "path": "/api/sync/discogs", "schedule": "0 6 * * *" }]
// }

import { syncDiscogsInventory } from '@/lib/discogs/sync'
import type { NextRequest }     from 'next/server'

export const maxDuration = 300 // 5 minutos — requiere Vercel Pro

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await syncDiscogsInventory()

  if (result.error) {
    return Response.json({ ok: false, ...result }, { status: 500 })
  }

  return Response.json({ ok: true, ...result })
}
