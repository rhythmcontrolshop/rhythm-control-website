import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { enrichReleases } from '@/lib/discogs/enrich'

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.ok) return NextResponse.json(await check.response.json(), { status: check.response.status })

  try {
    const body = await request.json().catch(() => ({}))
    const releaseIds: string[] | undefined = Array.isArray(body.releaseIds) ? body.releaseIds : undefined

    const result = await enrichReleases(releaseIds)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
