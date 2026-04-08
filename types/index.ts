// ─── RHYTHM CONTROL — TYPESCRIPT TYPES ───────────────────────────────────────

// ─── DISCOGS ─────────────────────────────────────────────────────────────────

export type DiscogsCondition = 'M' | 'NM' | 'VG+' | 'VG' | 'G+' | 'G' | 'F' | 'P'

export interface DiscogsArtist {
  id: number
  name: string
  anv: string
  join: string
  role: string
  resource_url: string
}

export interface DiscogsFormat {
  name: string
  qty: string
  descriptions: string[]
  text?: string
}

export interface DiscogsLabel {
  id: number
  name: string
  catno: string
  resource_url: string
}

export interface DiscogsRelease {
  id: number
  title: string
  artists: DiscogsArtist[]
  labels: DiscogsLabel[]
  formats: DiscogsFormat[]
  genres: string[]
  styles: string[]
  year: number
  country: string
  thumb: string
  cover_image: string
  resource_url: string
}

export interface DiscogsListing {
  id: number
  status: 'For Sale' | 'Sold' | 'Expired' | 'Draft'
  condition: DiscogsCondition
  sleeve_condition: DiscogsCondition
  price: {
    value: number
    currency: string
  }
  release: DiscogsRelease
  posted: string
  updated: string
  comments: string
  location: string
}

// ─── RELEASE (internal unified model) ────────────────────────────────────────

export interface Release {
  id: string
  discogs_listing_id: number
  discogs_release_id: number
  title: string
  artists: string[]
  labels: string[]
  catno: string
  genres: string[]
  styles: string[]
  format: string
  year: number | null
  country: string
  condition: DiscogsCondition
  sleeve_condition: DiscogsCondition
  price: number
  currency: string
  cover_image: string
  thumb: string
  // Extended data (Supabase)
  bpm?: number | null
  key?: string | null
  key_camelot?: string | null
  spotify_id?: string | null
  spotify_preview_url?: string | null
  youtube_id?: string | null
  comments?: string
  // Shopify
  shopify_product_id?: string | null
  shopify_variant_id?: string | null
  // Status
  status: 'active' | 'sold' | 'reserved' | 'hidden'
  created_at: string
  updated_at: string
}

// ─── SHOPIFY ──────────────────────────────────────────────────────────────────

export interface ShopifyMoneyV2 {
  amount: string
  currencyCode: string
}

export interface ShopifyImage {
  url: string
  altText: string | null
  width: number
  height: number
}

export interface ShopifyProductVariant {
  id: string
  title: string
  price: ShopifyMoneyV2
  availableForSale: boolean
  quantityAvailable: number
  sku: string
}

export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  featuredImage: ShopifyImage | null
  variants: {
    edges: Array<{ node: ShopifyProductVariant }>
  }
  tags: string[]
  vendor: string
}

export interface ShopifyCartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    price: ShopifyMoneyV2
    product: {
      title: string
      featuredImage: ShopifyImage | null
      handle: string
    }
  }
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    subtotalAmount: ShopifyMoneyV2
    totalAmount: ShopifyMoneyV2
    totalTaxAmount: ShopifyMoneyV2 | null
  }
  lines: {
    edges: Array<{ node: ShopifyCartLine }>
  }
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export type EventType = 'dj_set' | 'live' | 'release_party' | 'in_store' | 'other'

export interface Event {
  id: string
  title: string
  venue: string
  city: string
  country: string
  date: string
  start_time: string
  end_time?: string | null
  type: EventType
  flyer_url?: string | null
  ticket_url?: string | null
  lineup: string[]
  description?: string | null
  is_featured: boolean
  created_at: string
}

// ─── LABELS ───────────────────────────────────────────────────────────────────

export interface RecordLabel {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  description?: string | null
  discogs_label_id?: number | null
  bandcamp_url?: string | null
  instagram_url?: string | null
  is_own_label: boolean
  created_at: string
}

// ─── USER / PROFILE ──────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  username?: string | null
  avatar_url?: string | null
  city?: string | null
  country?: string | null
  discogs_username?: string | null
  instagram_handle?: string | null
  created_at: string
}

export interface WantlistItem {
  id: string
  user_id: string
  discogs_release_id: number
  title: string
  artists: string[]
  cover_image: string
  added_at: string
  notified: boolean
}

// ─── COMMUNITY / REQUESTS ────────────────────────────────────────────────────

export interface TrackRequest {
  id: string
  user_id: string
  title: string
  artist: string
  discogs_release_id?: number | null
  votes: number
  status: 'open' | 'found' | 'ordered' | 'available' | 'closed'
  created_at: string
  updated_at: string
}

export interface RequestVote {
  id: string
  request_id: string
  user_id: string
  created_at: string
}

// ─── AUDIO PLAYER ────────────────────────────────────────────────────────────

export type AudioSource = 'spotify' | 'youtube' | 'soundcloud'

export interface PlayerTrack {
  release_id: string
  title: string
  artist: string
  cover_image: string
  source: AudioSource
  source_id: string
  bpm?: number | null
  key?: string | null
  key_camelot?: string | null
  price: number
  currency: string
  shopify_variant_id?: string | null
}

// ─── ADMIN / SYNC ─────────────────────────────────────────────────────────────

export interface SyncJob {
  id: string
  type: 'discogs_inventory' | 'discogs_listing' | 'shopify_sync' | 'bpm_scan'
  status: 'pending' | 'running' | 'completed' | 'failed'
  items_processed: number
  items_total: number
  error?: string | null
  started_at: string
  completed_at?: string | null
}

export interface BarcodeScannedResult {
  barcode: string
  discogs_release_id?: number | null
  release?: Partial<Release> | null
  error?: string | null
}

// ─── FILTERS ─────────────────────────────────────────────────────────────────

export interface CatalogueFilters {
  genre?: string
  style?: string
  label?: string
  condition?: DiscogsCondition
  year_from?: number
  year_to?: number
  bpm_from?: number
  bpm_to?: number
  key?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'artist' | 'year'
  page?: number
}

// ─── API RESPONSES ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
