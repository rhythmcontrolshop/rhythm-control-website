// app/api/pos/sessions/route.ts
// GET  — List sessions (latest first)
// POST — Open a new cash register session

import { requireAdminWithClient } from '@/lib/supabase/require-admin'

// ─── GET /api/pos/sessions ─────────────────────────────────────────────────
export async function GET() {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const admin = check.admin

  const { data, error } = await admin
    .from('pos_sessions')
    .select('id, session_number, operator_id, status, opened_at, closed_at, opening_cash, expected_cash, actual_cash, cash_difference, total_sales, total_cash, total_card, total_bizum, total_discount, notes')
    .order('opened_at', { ascending: false })
    .limit(30)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ sessions: data })
}

// ─── POST /api/pos/sessions — Open new session ────────────────────────────
export async function POST(request: Request) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const admin = check.admin
  const userId = check.userId

  const body = await request.json()
  const { opening_cash = 0 } = body

  // Check if there's already an open session
  const { data: openSession } = await admin
    .from('pos_sessions')
    .select('id, session_number')
    .eq('status', 'open')
    .limit(1)
    .maybeSingle()

  if (openSession) {
    return Response.json(
      { error: `Ya hay una sesión abierta: ${openSession.session_number}. Ciérrala antes de abrir una nueva.` },
      { status: 409 }
    )
  }

  // Generate session number
  const { data: lastSession } = await admin
    .from('pos_sessions')
    .select('session_number')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextNum = 1
  if (lastSession?.session_number) {
    const match = lastSession.session_number.match(/SES-(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }

  const sessionNumber = `SES-${String(nextNum).padStart(5, '0')}`

  const { data, error } = await admin
    .from('pos_sessions')
    .insert({
      session_number: sessionNumber,
      operator_id: userId,
      status: 'open',
      opening_cash: parseFloat(opening_cash) || 0,
    })
    .select('id, session_number, status, opened_at, opening_cash')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ session: data }, { status: 201 })
}
