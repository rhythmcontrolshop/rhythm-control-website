// app/api/admin/seed/route.ts
// POST /api/admin/seed — inserta datos de muestra en Supabase para desarrollo.
// Solo disponible cuando NODE_ENV !== 'production'.
// Autenticación via cookie rc_admin.

import { createHash }        from 'crypto'
import { cookies }           from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { MOCK_RELEASES }     from '@/lib/mock/releases'

function computeAdminToken(secret: string): string {
  return createHash('sha256')
    .update(`${secret}:rc-admin-v1`)
    .digest('hex')
}

async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token  = cookieStore.get('rc_admin')?.value
  const secret = process.env.ADMIN_SECRET
  if (!token || !secret) return false
  return token === computeAdminToken(secret)
}

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'El seed solo está disponible en desarrollo' },
      { status: 403 }
    )
  }

  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Limpiar releases existentes de mock (listing_id >= 9000)
  await supabase
    .from('releases')
    .delete()
    .gte('discogs_listing_id', 9000)

  // Insertar mock releases
  const { data, error } = await supabase
    .from('releases')
    .insert(MOCK_RELEASES.map(r => ({ ...r })))
    .select('id, title')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    ok: true,
    inserted: data?.length ?? 0,
    titles: data?.map(r => r.title),
  })
}

export async function DELETE() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Operación no disponible en producción' },
      { status: 403 }
    )
  }

  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('releases')
    .delete()
    .gte('discogs_listing_id', 9000)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, message: 'Datos de muestra eliminados' })
}
