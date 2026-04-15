// app/api/admin/orders/route.ts
// Listado de pedidos con búsqueda, filtros y paginación — admin only

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { NextRequest }        from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)

  // Parámetros de paginación
  const page  = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')))
  const offset = (page - 1) * limit

  // Filtros
  const status     = searchParams.get('status')?.trim()
  const type       = searchParams.get('type')?.trim()       // pickup | shipping
  const search     = searchParams.get('q')?.trim()
  const dateFrom   = searchParams.get('from')?.trim()
  const dateTo     = searchParams.get('to')?.trim()

  // Construir query
  let query = admin
    .from('orders')
    .select('id, order_number, status, payment_status, fulfillment_type, customer_name, customer_email, total_amount, shipping_cost, pickup_code, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status)  query = query.eq('status', status)
  if (type)    query = query.eq('fulfillment_type', type)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59')

  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,pickup_code.ilike.%${search}%`
    )
  }

  const { data: orders, count, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Stats rápidas — pedidos de hoy y revenue
  const today = new Date().toISOString().slice(0, 10)
  const [todayRes, revenueRes, statusCountsRes] = await Promise.all([
    admin.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
    admin.from('orders').select('total_amount').eq('payment_status', 'paid'),
    admin.from('orders').select('status'),
  ])

  const totalRevenue = (revenueRes.data ?? []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
  const statusCounts: Record<string, number> = {}
  for (const o of (statusCountsRes.data ?? [])) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  }

  return Response.json({
    orders: orders ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
    stats: {
      todayOrders: todayRes.count ?? 0,
      totalRevenue,
      statusCounts,
    },
  })
}
