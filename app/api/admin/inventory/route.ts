import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { NextRequest }        from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)

  const search  = searchParams.get('q')?.trim() || ''
  const status  = searchParams.get('status') || ''
  const genre   = searchParams.get('genre') || ''
  const page    = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit   = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50')))
  const offset  = (page - 1) * limit

  let query = admin
    .from('releases')
    .select('id, title, artists, condition, price, status, thumb, quantity, barcode, location, discogs_listing_id, genres, styles, format', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (genre)  query = query.contains('genres', [genre])

  // Search by title or artist
  if (search) {
    query = query.or(`title.ilike.%${search}%,artists.cs.{"${search}"}`)
  }

  const { data, count, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
