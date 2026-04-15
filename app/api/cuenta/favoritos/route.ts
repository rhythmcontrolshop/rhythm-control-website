import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// GET /api/cuenta/favoritos — lista los favoritos del usuario
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('wantlist')
    .select('id, discogs_release_id, added_at')
    .eq('user_id', user.id)

  if (error) {
    return Response.json({ error: 'Error al obtener favoritos' }, { status: 500 })
  }

  return Response.json({ favorites: data ?? [] })
}

// POST /api/cuenta/favoritos — añade un favorito
// Body: { release_id: uuid } — usa el ID interno del release
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { release_id } = await request.json()
  if (!release_id) {
    return Response.json({ error: 'Falta release_id' }, { status: 400 })
  }

  // Obtener datos del release (necesitamos discogs_release_id para la wantlist)
  const { data: release } = await supabase
    .from('releases')
    .select('discogs_release_id, title, artists, cover_image')
    .eq('id', release_id)
    .single()

  if (!release) {
    return Response.json({ error: 'Release no encontrado' }, { status: 404 })
  }

  // Comprobar si ya existe en la wantlist
  const { data: existing } = await supabase
    .from('wantlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('discogs_release_id', release.discogs_release_id)
    .maybeSingle()

  if (existing) {
    return Response.json({ id: existing.id, already: true })
  }

  // Insertar en wantlist usando discogs_release_id
  const { data, error } = await supabase
    .from('wantlist')
    .insert({
      user_id: user.id,
      discogs_release_id: release.discogs_release_id,
      title: release.title ?? '',
      artists: release.artists ?? [],
      cover_image: release.cover_image ?? '',
    })
    .select('id')
    .single()

  if (error) {
    return Response.json({ error: 'Error al añadir favorito: ' + error.message }, { status: 500 })
  }

  return Response.json({ id: data.id, already: false })
}

// DELETE /api/cuenta/favoritos — elimina un favorito
// Body: { id: uuid } o { release_id: uuid } o { discogs_release_id: number }
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { id, release_id, discogs_release_id } = body

  if (id) {
    // Borrar por ID de la fila
    const { error } = await supabase
      .from('wantlist')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return Response.json({ error: 'Error al eliminar' }, { status: 500 })
  } else if (release_id) {
    // Borrar por release_id (UUID interno) — buscar el discogs_release_id primero
    const { data: release } = await supabase
      .from('releases')
      .select('discogs_release_id')
      .eq('id', release_id)
      .single()

    if (!release) return Response.json({ error: 'Release no encontrado' }, { status: 404 })

    const { error } = await supabase
      .from('wantlist')
      .delete()
      .eq('user_id', user.id)
      .eq('discogs_release_id', release.discogs_release_id)
    if (error) return Response.json({ error: 'Error al eliminar' }, { status: 500 })
  } else if (discogs_release_id) {
    // Borrar por discogs_release_id directamente
    const { error } = await supabase
      .from('wantlist')
      .delete()
      .eq('user_id', user.id)
      .eq('discogs_release_id', discogs_release_id)
    if (error) return Response.json({ error: 'Error al eliminar' }, { status: 500 })
  } else {
    return Response.json({ error: 'Falta id, release_id o discogs_release_id' }, { status: 400 })
  }

  return Response.json({ ok: true })
}
