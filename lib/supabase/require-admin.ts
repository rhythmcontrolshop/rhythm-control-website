// lib/supabase/require-admin.ts
// Helper para rutas admin: verifica sesión activa + rol admin en profiles.
// Devuelve { user, admin } si OK, o { error, status } si no.

import { createClient } from './server'
import { createAdminClient } from './admin'

type AdminCheckOk = { ok: true; userId: string; admin: ReturnType<typeof createAdminClient> }
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

  return { ok: true, userId: user.id, admin: createAdminClient() }
}
