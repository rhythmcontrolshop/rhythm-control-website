// app/api/admin/price-channels/route.ts
// CRUD para canales de precio — admin only

import { requireAdmin } from '@/lib/supabase/require-admin'
import { invalidatePriceCache } from '@/lib/pricing'

export async function GET() {
  const check = await requireAdmin()
  if (!check.ok) return check.response

  const { data, error } = await check.admin
    .from('price_channels')
    .select('*')
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function PATCH(request: Request) {
  const check = await requireAdmin()
  if (!check.ok) return check.response

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Payload inválido' }, { status: 400 })

  const { id, coefficient, is_active, name, sort_order } = body
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  const updates: Record<string, any> = {}
  if (coefficient !== undefined) {
    if (typeof coefficient !== 'number' || coefficient <= 0 || coefficient > 5) {
      return Response.json({ error: 'Coeficiente debe ser un número entre 0.01 y 5' }, { status: 400 })
    }
    updates.coefficient = coefficient
  }
  if (is_active !== undefined) updates.is_active = is_active
  if (name !== undefined) updates.name = name
  if (sort_order !== undefined) updates.sort_order = sort_order

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await check.admin
    .from('price_channels')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  invalidatePriceCache()
  return Response.json({ data })
}
