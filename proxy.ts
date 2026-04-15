// proxy.ts — Next.js 16 convention (replaces middleware.ts)
import { type NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  try {
    const { updateSession } = await import("@/lib/supabase/middleware")
    return await updateSession(request)
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
