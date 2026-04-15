import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
const ALLOWED = ['active', 'sold', 'reserved', 'gifted']
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const { status } = await request.json().catch(() => ({}))
  if (!ALLOWED.includes(status)) return Response.json({ error: 'Estado inválido' }, { status: 400 })
  const { error } = await createAdminClient()
    .from('releases').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return Response.json({ error: 'Error al actualizar' }, { status: 500 })
  return Response.json({ ok: true })
}
