// lib/discogs/enrich.ts
// Enriquece releases con datos extra de Discogs:
// tracklist, notas, imagen del dorso, styles, genres, artist profile

import { createAdminClient } from '@/lib/supabase/admin'
import { getReleaseDetail, getArtistDetail, type DiscogsAPIReleaseDetail } from './client'

const RATE_LIMIT_MS = 1200

interface EnrichResult {
  processed: number
  updated:   number
  errors:    string[]
}

export async function enrichReleases(releaseIds?: string[]): Promise<EnrichResult> {
  const supabase = createAdminClient()
  const result: EnrichResult = { processed: 0, updated: 0, errors: [] }

  // Releases que aún no tienen tracklist
  let query = supabase
    .from('releases')
    .select('id, discogs_release_id, artists')
    .eq('status', 'active')
    .is('discogs_tracklist', null)

  if (releaseIds?.length) {
    query = (query as any).in('id', releaseIds)
  }

  const { data: releases, error } = await (query as any).limit(50)

  if (error || !releases) {
    result.errors.push(`Error fetching releases: ${error?.message}`)
    return result
  }

  for (const release of releases) {
    try {
      result.processed++

      const detail = await getReleaseDetail(release.discogs_release_id)

      // Imagen del dorso (primera imagen secundaria)
      let backCoverImage: string | null = null
      if (detail.images && detail.images.length > 1) {
        const secondary = detail.images.filter(img => img.type === 'secondary')
        if (secondary.length > 0) {
          backCoverImage = secondary[0].uri || secondary[0].resource_url
        }
      }

      const updateData: Record<string, unknown> = {
        styles:            detail.styles  || [],
        genres:            detail.genres  || [],
        discogs_notes:     detail.notes   || null,
        back_cover_image:  backCoverImage,
        discogs_tracklist: detail.tracklist?.map(t => ({
          position: t.position,
          title:    t.title,
          duration: t.duration,
          type:     t.type ?? null,
        })) ?? null,
        updated_at: new Date().toISOString(),
      }

      // Profile del artista principal (best-effort)
      const artistId = detail.artists?.[0]?.id
      if (artistId) {
        await delay(RATE_LIMIT_MS)
        try {
          const artist = await getArtistDetail(artistId)
          updateData.artist_profile = artist.profile ?? null
        } catch {
          // no es crítico
        }
      }

      const { error: updateError } = await supabase
        .from('releases')
        .update(updateData)
        .eq('id', release.id)

      if (updateError) {
        result.errors.push(`Update error ${release.id}: ${updateError.message}`)
      } else {
        result.updated++
      }

      await delay(RATE_LIMIT_MS)
    } catch (err) {
      result.errors.push(`Error ${release.id}: ${err}`)
    }
  }

  return result
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
