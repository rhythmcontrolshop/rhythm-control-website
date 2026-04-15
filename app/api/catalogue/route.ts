// app/api/catalogue/route.ts
// GET /api/catalogue — releases activos con filtros, paginación y precios por canal.

import { createClient } from '@/lib/supabase/server'
import { getPriceChannels, calculateChannelPrice } from '@/lib/pricing'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const genre   = searchParams.get('genre')
  const style   = searchParams.get('style')
  const label   = searchParams.get('label')
  const sort    = searchParams.get('sort') ?? 'newest'
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const channel = searchParams.get('channel') ?? 'online' // canal de precio para la web
  const perPage = 24

  const supabase = await createClient()

  let query = supabase
    .from('releases')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  if (genre && genre !== 'all') {
    query = query.contains('genres', [genre])
  }
  if (style) {
    query = query.contains('styles', [style])
  }
  if (label) {
    query = query.contains('labels', [label])
  }

  switch (sort) {
    case 'price_asc':  query = query.order('price', { ascending: true });  break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'year':       query = query.order('year',  { ascending: false }); break
    default:           query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, error, count } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Obtener coeficientes de precio para el canal solicitado
  let priceCoefficient = 1.05 // default online
  try {
    const channels = await getPriceChannels()
    const ch = channels.find(c => c.slug === channel)
    if (ch) priceCoefficient = ch.coefficient
  } catch {
    // Si falla, usar default
  }

  // Aplicar coeficiente de precio a cada release
  const releasesWithPricing = (data ?? []).map(release => ({
    ...release,
    price: calculateChannelPrice(release.price, priceCoefficient),
  }))

  return Response.json({
    data:        releasesWithPricing,
    total:       count       ?? 0,
    page,
    per_page:    perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  })
}
