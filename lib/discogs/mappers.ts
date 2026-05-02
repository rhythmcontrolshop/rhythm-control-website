// lib/discogs/mappers.ts
// Transforma respuestas de la API de Discogs al modelo interno de Release.

import type { DiscogsAPIListing } from './client'
import type { DiscogsCondition } from '@/types'

const VALID_CONDITIONS: DiscogsCondition[] = [
  'M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P',
]

function normalizeCondition(raw?: string): DiscogsCondition {
  if (raw && (VALID_CONDITIONS as string[]).includes(raw)) {
    return raw as DiscogsCondition
  }
  return 'VG'
}

function normalizeArtistName(name: string): string {
  // Discogs añade números de desambiguación: "Aphex Twin (2)" → "Aphex Twin"
  return name.replace(/\s*\(\d+\)\s*$/, '').trim()
}

export function mapListingToRelease(listing: DiscogsAPIListing) {
  const { release } = listing

  return {
    discogs_listing_id: listing.id,
    discogs_release_id: release.id,
    title: release.title,
    artists:  (release.artists  ?? []).map(a => normalizeArtistName(a.name)),
    labels:   (release.labels   ?? []).map(l => l.name),
    catno:     release.labels?.[0]?.catno ?? '',
    genres:    release.genres  ?? [],
    styles:    release.styles  ?? [],
    format:    release.formats?.[0]?.name ?? '',
    year:      release.year    ?? null,
    country:   release.country ?? '',
    condition:       normalizeCondition(listing.condition),
    sleeve_condition: normalizeCondition(listing.sleeve_condition),
    price:     listing.price.value,
    currency:  listing.price.currency,
    cover_image: release.cover_image ?? '',
    thumb:       release.thumb       ?? '',
    comments:    listing.comments    ?? '',
    status: 'active' as const,
  }
}
