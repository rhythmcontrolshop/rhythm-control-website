// lib/supabase/require-admin.ts
// Helper para rutas admin: verifica sesión activa + rol admin en profiles.
// E1-13: Devuelve userId sin crear adminClient automáticamente.
// El llamador decide si necesita admin client o no.

import { createClient } from './server'
import { createAdminClient } from './admin'

type AdminCheckOk = { ok: true; userId: string }
type AdminCheckFail = { ok: false; response: Response }

export async function requireAdmin(): Promise<AdminCheckOk | AdminCheckFail> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: 'No autorizado' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return {
      ok: false,
      response: Response.json({ error: 'Prohibido' }, { status: 403 }),
    }
  }

  return { ok: true, userId: user.id }
}

/**
 * Helper que incluye admin client para rutas que realmente necesitan bypass de RLS.
 * Solo usar cuando sea estrictamente necesario: webhooks, reservas, bulk operations.
 */
export async function requireAdminWithClient(): Promise<
  | { ok: true; userId: string; admin: ReturnType<typeof createAdminClient> }
  | { ok: false; response: Response }
> {
  const result = await requireAdmin()
  if (!result.ok) return result

  return { ok: true, userId: result.userId, admin: createAdminClient() }
}
