// app/api/audio/spotify/[id]/route.ts
// GET /api/audio/spotify/:id — Obtiene preview de 30 seg de un track de Spotify.

import { getTrackPreview } from '@/lib/spotify/client'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return Response.json({ error: 'ID requerido' }, { status: 400 })
  }

  const track = await getTrackPreview(id)

  if (!track) {
    return Response.json({ error: 'Track no encontrado' }, { status: 404 })
  }

  return Response.json({
    id: track.id,
    name: track.name,
    artists: track.artists.map(a => a.name),
    album: track.album.name,
    image: track.album.images?.[0]?.url || null,
    preview_url: track.preview_url,
  })
}
