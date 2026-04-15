// lib/supabase/middleware.ts
import { createServerClient }            from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

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
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() valida el JWT contra Supabase — no usar getSession() en servidor
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedAdmin =
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login')

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

  return response
}

function redirectToLogin(request: NextRequest, error?: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search   = error ? `?error=${error}` : ''
  return NextResponse.redirect(url)
}
