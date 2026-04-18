// lib/supabase/admin.ts
// Cliente con service_role — bypasea RLS. Solo usar en servidor.
// NUNCA exponer en el cliente ni en código público.
// E4-7: Lazy singleton — reutiliza instancia dentro del mismo request

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _adminClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient

  _adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return _adminClient
}

// Reset para testing o cuando se necesite fresh instance
export function resetAdminClient() {
  _adminClient = null
}
