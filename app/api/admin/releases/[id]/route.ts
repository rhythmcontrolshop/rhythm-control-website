import { requireAdminWithClient } from '@/lib/supabase/require-admin'

const ALLOWED_STATUS = ['active', 'sold', 'reserved', 'hidden', 'gifted']
const ALLOWED_FIELDS = ['status', 'quantity', 'barcode', 'location']

function generateEAN13(): string {
  // Prefijo 200 = código interno (no registrado globalmente)
  // Genera 12 dígitos + dígito de control
  let code = '200'
  for (let i = 0; i < 9; i++) code += Math.floor(Math.random() * 10)

  // Calcular dígito de control EAN-13
  const digits = code.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  const check = (10 - (sum % 10)) % 10
  return code + check
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdminWithClient()
  if (!check.ok) return check.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const updates: Record<string, any> = {}

  // Procesar generate_barcode
  if (body.generate_barcode) {
    updates.barcode = generateEAN13()
  }

  // Procesar campos permitidos
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      if (field === 'status' && !ALLOWED_STATUS.includes(body.status)) {
        return Response.json({ error: 'Estado inválido' }, { status: 400 })
      }
      if (field === 'quantity') {
        const q = parseInt(body.quantity)
        if (isNaN(q) || q < 0) return Response.json({ error: 'Cantidad inválida' }, { status: 400 })
        updates.quantity = q
      } else {
        updates[field] = body[field]
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { error } = await check.admin
    .from('releases').update(updates).eq('id', id)

  if (error) return Response.json({ error: 'Error al actualizar' }, { status: 500 })
  return Response.json({ ok: true, barcode: updates.barcode })
}
