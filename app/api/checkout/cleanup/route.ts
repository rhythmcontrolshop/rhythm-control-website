// app/api/checkout/cleanup/route.ts
// POST — Unreserve items from a failed checkout attempt
// Called by the frontend when the Redsys redirect fails

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CleanupSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
})

export async function POST(request: Request) {
  try {
    // Solo usuarios autenticados pueden liberar su propio stock reservado
    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const raw = await request.json()
    const parsed = CleanupSchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid item IDs' }, { status: 400 })
    }

    const { itemIds } = parsed.data
    const supabase = createAdminClient()

    // Find items that are currently reserved
    const { data: reserved } = await supabase
      .from('releases')
      .select('id')
      .in('id', itemIds)
      .eq('status', 'reserved')

    if (reserved && reserved.length > 0) {
      const reservedIds = reserved.map(r => r.id)
      await supabase.rpc('unreserve_releases', { p_release_ids: reservedIds })
    }

    return Response.json({ ok: true, unreserved: reserved?.length ?? 0 })
  } catch (err: any) {
    console.error('Checkout cleanup error:', err)
    return Response.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
