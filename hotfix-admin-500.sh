#!/bin/bash
set -e
PROJECT="${1:-.}"
echo "=== HOTFIX: Admin 500 Error ==="

mkdir -p "$PROJECT/lib/supabase"
cat > "$PROJECT/lib/supabase/middleware.ts" << 'ENDOFFILE'
// lib/supabase/middleware.ts
import { createServerClient }            from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest): Promise<NextResponse> {
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
              response.cookies.set(name, value, options)
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
  } catch (err) {
    const isProtectedAdmin =
      request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login') &&
      !request.nextUrl.pathname.startsWith('/admin/recover') &&
      !request.nextUrl.pathname.startsWith('/admin/reset-password')

    if (isProtectedAdmin) {
      return redirectToLogin(request, 'session-error')
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
ENDOFFILE
echo "✓ lib/supabase/middleware.ts"
echo ""
echo "=== HOTFIX aplicado ==="
