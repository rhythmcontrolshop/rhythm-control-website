// app/api/pos/inventory/route.ts
// GET — Search active releases for POS (with physical channel pricing)

import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { getPhysicalPrice } from '@/lib/pricing'

export async function GET(request: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const admin = check.admin

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q')?.trim() || ''
  const barcode = searchParams.get('barcode')?.trim() || ''
  const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') || '30')))

  let query = admin
    .from('releases')
    .select('id, title, artists, condition, price, format, quantity, thumb, barcode, genres, styles, sleeve_condition')
    .eq('status', 'active')
    .gt('quantity', 0)
    .order('title', { ascending: true })
    .limit(limit)

  // Barcode search takes priority
  if (barcode) {
    query = query.eq('barcode', barcode)
  } else if (search.length >= 2) {
    // Use RPC function for proper search across all fields (title, artists, labels, catno, etc.)
    const { data: matchIds } = await admin.rpc('search_release_ids', { search_query: search })
    const ids = matchIds ?? []
    if (ids.length === 0) return Response.json({ items: [] })
    query = query.in('id', ids)
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Calculate physical channel prices
  const items = await Promise.all((data ?? []).map(async (item) => {
    const physicalPrice = await getPhysicalPrice(parseFloat(String(item.price)))
    return {
      ...item,
      price: parseFloat(String(item.price)),
      price_physical: physicalPrice,
    }
  }))

  return Response.json({ items })
}
