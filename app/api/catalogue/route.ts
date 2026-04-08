// app/api/catalogue/route.ts
// GET /api/catalogue — releases activos con filtros y paginación.
// Usa RLS del cliente anon: solo devuelve status = 'active'.

import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const genre   = searchParams.get('genre')
  const style   = searchParams.get('style')
  const sort    = searchParams.get('sort') ?? 'newest'
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
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

  return Response.json({
    data:        data        ?? [],
    total:       count       ?? 0,
    page,
    per_page:    perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  })
}
