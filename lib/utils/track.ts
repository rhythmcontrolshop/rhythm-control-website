// lib/utils/track.ts
// Helper para construir objetos PlayerTrack desde un Release.

import type { Release, PlayerTrack } from '@/types'

export function buildPlayerTrack(release: Release): PlayerTrack {
  const source = release.spotify_id
    ? 'spotify'
    : release.youtube_id
      ? 'youtube'
      : 'soundcloud'

  const sourceId = release.spotify_id ?? release.youtube_id ?? ''

  return {
    release_id:         release.id,
    title:              release.title,
    artist:             release.artists[0] ?? '',
    cover_image:        release.cover_image,
    source,
    source_id:          sourceId,
    bpm:                release.bpm,
    key:                release.key_camelot ?? release.key,
    price:              release.price,
    currency:           release.currency,
    shopify_variant_id: release.shopify_variant_id,
  }
}
