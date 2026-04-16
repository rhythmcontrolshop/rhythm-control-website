// app/api/admin/shipping-rates/route.ts
// CRUD para tarifas de envío — admin only

import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET() {
  const check = await requireAdmin()
  if (!check.ok) return check.response

  const { data, error } = await check.admin
    .from('shipping_rates')
    .select('*')
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function POST(request: Request) {
  const check = await requireAdmin()
  if (!check.ok) return check.response

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Payload inválido' }, { status: 400 })

  const { name, description, zone, method, carrier, min_weight_kg, max_weight_kg, price, free_above, sort_order } = body
  if (!name || !method || price === undefined) {
    return Response.json({ error: 'Nombre, método y precio son obligatorios' }, { status: 400 })
  }

  const { data, error } = await check.admin
    .from('shipping_rates')
    .insert({
      name,
      description,
      zone: zone || 'es_peninsula',
      method,
      carrier,
      min_weight_kg: min_weight_kg ?? 0,
      max_weight_kg: max_weight_kg ?? 2,
      price,
      free_above,
      sort_order: sort_order ?? 99,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function PATCH(request: Request) {
  const check = await requireAdmin()
  if (!check.ok) return check.response

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Payload inválido' }, { status: 400 })

  const { id, ...updates } = body
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  const allowed = ['name', 'description', 'zone', 'method', 'carrier', 'min_weight_kg', 'max_weight_kg', 'price', 'free_above', 'is_active', 'sort_order']
  const filtered: Record<string, any> = {}
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key]
  }

  if (Object.keys(filtered).length === 0) {
    return Response.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await check.admin
    .from('shipping_rates')
    .update(filtered)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function DELETE(request: Request) {
  const check = await requireAdmin()
  if (!check.ok) return check.response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await check.admin
    .from('shipping_rates')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
