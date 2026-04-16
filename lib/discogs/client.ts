// lib/discogs/client.ts
// Cliente para la API de Discogs. Autenticación via Personal Access Token.

const BASE_URL = 'https://api.discogs.com'

function getHeaders(): HeadersInit {
  return {
    Authorization: `Discogs token=${process.env.DISCOGS_ACCESS_TOKEN}`,
    'User-Agent': 'RhythmControl/1.0 +https://rhythmcontrol.es',
    Accept: 'application/vnd.discogs.v2.plaintext+json',
  }
}

async function request<T>(
  path: string,
  params?: Record<string, string | number>,
  retries = 1
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, String(value))
    )
  }

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 0 },
  })

  // Rate limit — reintentar una sola vez tras 2s
  if (res.status === 429 && retries > 0) {
    await new Promise(r => setTimeout(r, 2000))
    return request<T>(path, params, retries - 1)
  }

  if (!res.ok) {
    throw new Error(`Discogs API ${res.status}: ${res.statusText} [${path}]`)
  }

  return res.json() as Promise<T>
}


// ── Tipos de respuesta de la API de Discogs ──────────────────

export interface DiscogsPagination {
  page: number
  pages: number
  per_page: number
  items: number
  urls?: { next?: string; last?: string }
}

export interface DiscogsAPIArtist {
  id?: number
  name: string
  anv?: string
  join?: string
  role?: string
}

export interface DiscogsAPILabel {
  id?: number
  name: string
  catno?: string
}

export interface DiscogsAPIFormat {
  name: string
  qty?: string
  descriptions?: string[]
  text?: string
}

export interface DiscogsAPIRelease {
  id: number
  title: string
  artists?: DiscogsAPIArtist[]
  labels?: DiscogsAPILabel[]
  formats?: DiscogsAPIFormat[]
  genres?: string[]
  styles?: string[]
  year?: number
  country?: string
  thumb?: string
  cover_image?: string
}

export interface DiscogsAPITrack {
  position: string
  title: string
  duration?: string
  type?: string
}

export interface DiscogsAPIReleaseDetail extends DiscogsAPIRelease {
  images?: DiscogsAPIImage[]
  tracklist?: DiscogsAPITrack[]
  notes?: string
}

export interface DiscogsAPIListing {
  id: number
  status: string
  condition: string
  sleeve_condition?: string
  price: { value: number; currency: string }
  release: DiscogsAPIRelease
  posted?: string
  updated?: string
  comments?: string
  location?: string
}

export interface DiscogsInventoryResponse {
  pagination: DiscogsPagination
  listings: DiscogsAPIListing[]
}

export interface DiscogsSearchResult {
  id: number
  type: string
  title: string
  thumb?: string
  cover_image?: string
  year?: string
  country?: string
  label?: string[]
  format?: string[]
  genre?: string[]
  style?: string[]
  barcode?: string[]
  resource_url?: string
}

export interface DiscogsSearchResponse {
  pagination: DiscogsPagination
  results: DiscogsSearchResult[]
}


// ── Métodos públicos ─────────────────────────────────────────

export async function getInventory(
  username: string,
  page = 1,
  perPage = 100
): Promise<DiscogsInventoryResponse> {
  return request<DiscogsInventoryResponse>(`/users/${username}/inventory`, {
    status: 'For Sale',
    sort: 'listed',
    sort_order: 'desc',
    page,
    per_page: perPage,
  })
}

export async function searchByBarcode(
  barcode: string
): Promise<DiscogsSearchResponse> {
  return request<DiscogsSearchResponse>('/database/search', {
    barcode,
    type: 'release',
  })
}

export async function getReleaseDetail(
  releaseId: number
): Promise<DiscogsAPIReleaseDetail> {
  return request<DiscogsAPIReleaseDetail>(`/releases/${releaseId}`)
}

export interface DiscogsAPIImage {
  uri: string
  resource_url: string
  type: 'primary' | 'secondary'
  width?: number
  height?: number
}

export interface DiscogsAPIArtistDetail {
  id: number
  name: string
  profile?: string
  urls?: string[]
  images?: DiscogsAPIImage[]
}

export async function getArtistDetail(
  artistId: number
): Promise<DiscogsAPIArtistDetail> {
  return request<DiscogsAPIArtistDetail>(`/artists/${artistId}`)
}

