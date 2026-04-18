import { requireAdminWithClient } from '@/lib/supabase/require-admin'
import { NextRequest }   from 'next/server'

export async function GET(request: NextRequest) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response
  const admin = check.admin
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q')?.trim() || ''

  // Get profiles with order stats
  let query = admin
    .from('profiles')
    .select('id, full_name, email, phone, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: profiles, count, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Get order counts per customer
  const customerIds = (profiles ?? []).map(p => p.id)
  let orderCounts: Record<string, number> = {}
  let totalSpent: Record<string, number> = {}

  if (customerIds.length) {
    const { data: orders } = await admin
      .from('orders')
      .select('customer_id, total_amount')
      .in('customer_id', customerIds)

    if (orders) {
      for (const o of orders as any[]) {
        orderCounts[o.customer_id] = (orderCounts[o.customer_id] || 0) + 1
        totalSpent[o.customer_id] = (totalSpent[o.customer_id] || 0) + (o.total_amount || 0)
      }
    }
  }

  const customers = (profiles ?? []).map(p => ({
    ...p,
    order_count: orderCounts[p.id] || 0,
    total_spent: totalSpent[p.id] || 0,
  }))

  return Response.json({ customers, total: count ?? 0 })
}
