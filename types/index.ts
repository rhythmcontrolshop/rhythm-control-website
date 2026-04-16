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
  cover_image:       string
  back_cover_image?: string | null
  thumb: string
  // Extended data (Supabase)
  bpm?: number | null
  key?: string | null
  key_camelot?: string | null
  spotify_id?: string | null
  spotify_preview_url?: string | null
  youtube_id?: string | null
  bandcamp_album_id?: string | null
  bandcamp_track_id?: string | null
  youtube_track_ids?: Record<string, string> | null
  discogs_tracklist?: DiscogsTrack[] | null
  discogs_notes?: string | null
  artist_profile?: string | null
  comments?: string
  // Shopify (legacy, may be removed later)
  shopify_product_id?: string | null
  shopify_variant_id?: string | null
  // Inventory
  quantity: number
  barcode?: string | null
  location?: string | null
  // Status
  status: 'active' | 'sold' | 'reserved' | 'hidden'
  created_at: string
  updated_at: string
}

// ─── DISCOGS TRACKLIST ───────────────────────────────────────────────────────

export interface DiscogsTrack {
  position: string
  title: string
  duration?: string
  type?: string | null
}

// ─── SHOPIFY (legacy — kept for reference, may be removed) ───────────────────

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

export type UserRole = 'customer' | 'admin'

export interface UserProfile {
  id: string
  email: string
  username?: string | null
  avatar_url?: string | null
  city?: string | null
  country?: string | null
  discogs_username?: string | null
  instagram_handle?: string | null
  // Extended fields
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  phone?: string | null
  tax_id?: string | null
  address?: string | null
  postal_code?: string | null
  province?: string | null
  country_code?: string | null
  role: UserRole
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

// ─── PRICE CHANNELS ──────────────────────────────────────────────────────────

export interface PriceChannel {
  id: string
  slug: 'physical' | 'online' | 'discogs'
  name: string
  coefficient: number
  is_active: boolean
  sort_order: number
  updated_at: string
  updated_by?: string | null
}

// ─── SHIPPING ─────────────────────────────────────────────────────────────────

export type ShippingMethod = 'home_delivery' | 'post_office' | 'click_collect'

export interface ShippingRate {
  id: string
  name: string
  description?: string | null
  zone: string
  method: ShippingMethod
  carrier?: string | null
  min_weight_kg: number
  max_weight_kg: number
  price: number
  free_above?: number | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ─── RESERVATIONS (Click & Collect) ──────────────────────────────────────────

export type ReservationStatus = 'pending' | 'confirmed' | 'collected' | 'cancelled' | 'expired'

export interface Reservation {
  id: string
  release_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  pickup_code: string
  expires_at: string
  status: ReservationStatus
  confirmed_at?: string | null
  collected_at?: string | null
  cancelled_at?: string | null
  created_at: string
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'created' | 'processing' | 'shipped' | 'delivered' | 'collected' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Order {
  id: string
  order_number: string
  user_id?: string | null
  customer_email: string
  customer_name: string
  customer_phone?: string | null
  shipping_address?: ShippingAddressSnapshot | null
  shipping_method?: ShippingMethod | null
  shipping_rate_id?: string | null
  shipping_cost: number
  price_channel: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  stripe_session_id?: string | null
  stripe_payment_intent?: string | null
  payment_status: PaymentStatus
  pickup_code?: string | null
  status: OrderStatus
  tracking_number?: string | null
  tracking_url?: string | null
  notes?: string | null
  items?: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  release_id?: string | null
  title: string
  artists: string[]
  condition?: string | null
  cover_image?: string | null
  price_base: number
  price_channel: number
  quantity: number
  created_at: string
}

export interface ShippingAddressSnapshot {
  address: string
  city: string
  postalCode: string
  province?: string
  countryCode: string
}

// ─── POS SALES ───────────────────────────────────────────────────────────────

export type POSPaymentMethod = 'cash' | 'card' | 'bizum'

export interface POSSale {
  id: string
  sale_number: string
  operator_id?: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  payment_method: POSPaymentMethod
  customer_email?: string | null
  customer_name?: string | null
  notes?: string | null
  items?: POSSaleItem[]
  created_at: string
}

export interface POSSaleItem {
  id: string
  pos_sale_id: string
  release_id?: string | null
  title: string
  artists: string[]
  condition?: string | null
  price_base: number
  price_channel: number
  quantity: number
  created_at: string
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
