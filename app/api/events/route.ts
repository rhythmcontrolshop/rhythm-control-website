// app/api/events/route.ts
// E2-10: Endpoint público para obtener eventos próximos (sin auth)
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Solo eventos futuros, ordenados por fecha
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('events')
    .select('id, date, type, title, venue, lineup, flyer_url, web')
    .gte('date', today)
    .order('date', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data ?? [])
}
