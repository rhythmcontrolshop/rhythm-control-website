import { NextRequest, NextResponse } from 'next/server'
import { enrichReleases } from '@/lib/discogs/enrich'

export async function POST(request: NextRequest) {
  // Simple auth check
  const auth = request.headers.get('authorization')
  const secret = process.env.ADMIN_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const releaseIds: string[] | undefined = body.releaseIds

    const result = await enrichReleases(releaseIds)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
