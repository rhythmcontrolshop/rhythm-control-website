import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await request.json()
  
  const { error } = await supabase
    .from('wantlist')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return Response.json({ error: 'Error al eliminar' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
