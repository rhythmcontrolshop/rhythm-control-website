// lib/supabase/middleware.ts
import { createServerClient }            from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkAuthRateLimit }            from '@/lib/rate-limit'

const AUTH_PATHS = ['/login', '/admin/login', '/registro']

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Si faltan las env vars de Supabase, dejar pasar sin hacer nada
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  // Rate limiting para rutas de autenticación (con soporte Upstash Redis)
  if (AUTH_PATHS.some(p => request.nextUrl.pathname === p) && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateCheck = await checkAuthRateLimit(ip)
    if (!rateCheck.allowed) {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              // Detectar si es cookie de admin (contiene auth token y estamos en /admin)
              const isAdminPath = request.nextUrl.pathname.startsWith('/admin')
              const isAdminCookie = name.includes('auth-token')

              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: isAdminPath && isAdminCookie ? 'strict' : 'lax',
              })
            })
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

  // E1-7: Añadir X-Request-ID para trazabilidad
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  return response
}

function redirectToLogin(request: NextRequest, error?: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search   = error ? `?error=${error}` : ''
  return NextResponse.redirect(url)
}
