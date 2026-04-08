// app/api/admin/auth/route.ts
// POST /api/admin/auth — login: verifica ADMIN_SECRET y establece cookie
// DELETE /api/admin/auth — logout: elimina la cookie

import { createHash } from 'crypto'
import { cookies }    from 'next/headers'
import type { NextRequest } from 'next/server'

// Debe coincidir con el salt del middleware
function computeAdminToken(secret: string): string {
  return createHash('sha256')
    .update(`${secret}:rc-admin-v1`)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { secret } = body as { secret?: string }

  // ADMIN_SECRET no configurado — falta en .env.local
  if (!process.env.ADMIN_SECRET) {
    return Response.json(
      { error: 'ADMIN_SECRET no está configurado en .env.local' },
      { status: 500 }
    )
  }

  // DEBUG — quitar después de resolver el problema
  const envSet     = !!process.env.ADMIN_SECRET
  const envLength  = process.env.ADMIN_SECRET?.length ?? 0
  const match      = secret === process.env.ADMIN_SECRET

  if (!secret || !match) {
    return Response.json({
      error: 'Contraseña incorrecta',
      debug: {
        secretReceived: !!secret,
        secretLength:   secret?.length ?? 0,
        envSet,
        envLength,
        match,
      },
    }, { status: 401 })
  }

  const token      = computeAdminToken(secret)
  const cookieStore = await cookies()

  cookieStore.set('rc_admin', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 24 * 30, // 30 días
    path:     '/',
  })

  return Response.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('rc_admin')
  return Response.json({ ok: true })
}
