// app/api/pos/sessions/[id]/close/route.ts
// POST — Close a cash register session (cierre de caja)

import { requireAdminWithClient } from '@/lib/supabase/require-admin'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const admin = check.admin

  const { id } = await params
  const body = await request.json()
  const { actual_cash, notes } = body

  if (actual_cash === undefined || actual_cash === null) {
    return Response.json({ error: 'Falta el contaje de efectivo (actual_cash)' }, { status: 400 })
  }

  // Get the session
  const { data: session, error: sessionError } = await admin
    .from('pos_sessions')
    .select('id, session_number, status, opening_cash')
    .eq('id', id)
    .single()

  if (sessionError || !session) {
    return Response.json({ error: 'Sesión no encontrada' }, { status: 404 })
  }

  if (session.status === 'closed') {
    return Response.json({ error: 'Esta sesión ya está cerrada' }, { status: 409 })
  }

  // Calculate totals from all sales in this session
  const { data: sales, error: salesError } = await admin
    .from('pos_sales')
    .select('total, payment_method, discount_amount')
    .eq('session_id', id)

  if (salesError) return Response.json({ error: salesError.message }, { status: 500 })

  const totals = (sales ?? []).reduce(
    (acc, sale) => {
      acc.total_sales += 1
      acc.total_discount += parseFloat(String(sale.discount_amount || 0))
      if (sale.payment_method === 'cash') acc.total_cash += parseFloat(String(sale.total || 0))
      if (sale.payment_method === 'card') acc.total_card += parseFloat(String(sale.total || 0))
      if (sale.payment_method === 'bizum') acc.total_bizum += parseFloat(String(sale.total || 0))
      return acc
    },
    { total_sales: 0, total_cash: 0, total_card: 0, total_bizum: 0, total_discount: 0 }
  )

  // Expected cash = opening_cash + all cash sales
  const openingCash = parseFloat(String(session.opening_cash || 0))
  const expectedCash = Math.round((openingCash + totals.total_cash) * 100) / 100
  const actualCash = Math.round(parseFloat(String(actual_cash)) * 100) / 100
  const cashDifference = Math.round((actualCash - expectedCash) * 100) / 100

  // Close the session
  const { data, error } = await admin
    .from('pos_sessions')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      expected_cash: expectedCash,
      actual_cash: actualCash,
      cash_difference: cashDifference,
      total_sales: totals.total_sales,
      total_cash: totals.total_cash,
      total_card: totals.total_card,
      total_bizum: totals.total_bizum,
      total_discount: totals.total_discount,
      notes: notes || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    session: data,
    summary: {
      opening_cash: openingCash,
      cash_sales: totals.total_cash,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      difference: cashDifference,
      total_sales: totals.total_sales,
      total_card: totals.total_card,
      total_bizum: totals.total_bizum,
      total_discount: totals.total_discount,
    },
  })
}
