// app/api/shipping-rates/route.ts
// GET — Tarifas de envío activas para el checkout (lectura pública)

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shipping_rates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rates: data ?? [] })
}
