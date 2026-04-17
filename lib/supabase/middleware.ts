// lib/supabase/middleware.ts
import { createServerClient }            from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rate limiting en memoria — protege dentro de cada instancia edge.
// Para protección multi-instancia en producción, sustituir por Upstash Redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10       // intentos por ventana
const RATE_LIMIT_WINDOW = 60_000 // 1 minuto

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

const AUTH_PATHS = ['/login', '/admin/login', '/registro']

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Si faltan las env vars de Supabase, dejar pasar sin hacer nada
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  // Rate limiting para rutas de autenticación
  if (AUTH_PATHS.some(p => request.nextUrl.pathname === p) && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  let response = NextResponse.next({ request })
  let user: any = null

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              })
            )
          },
        },
      }
    )

    const { data } = await supabase.auth.getUser()
    user = data.user

    const isProtectedAdmin =
      request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login') &&
      !request.nextUrl.pathname.startsWith('/admin/recover') &&
      !request.nextUrl.pathname.startsWith('/admin/reset-password')

    if (isProtectedAdmin) {
      if (!user) return redirectToLogin(request)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        return redirectToLogin(request, 'sin-permisos')
      }
    }
  } catch {
    const isProtectedAdmin =
      request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login') &&
      !request.nextUrl.pathname.startsWith('/admin/recover') &&
      !request.nextUrl.pathname.startsWith('/admin/reset-password')

    if (isProtectedAdmin) return redirectToLogin(request, 'session-error')
  }

  return response
}

function redirectToLogin(request: NextRequest, error?: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search   = error ? `?error=${error}` : ''
  return NextResponse.redirect(url)
}
