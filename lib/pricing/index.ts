// lib/pricing/index.ts
// Sistema de precios por canal.
// Los coeficientes se almacenan en price_channels (Supabase) y son ajustables desde admin.
// Canales: physical (x0.95), online (x1.05), discogs (x1.10)

import { createAdminClient } from '@/lib/supabase/admin'
import type { PriceChannel } from '@/types'

// Cache en memoria para no consultar Supabase en cada request
let channelsCache: PriceChannel[] | null = null
let cacheExpiry = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function getPriceChannels(): Promise<PriceChannel[]> {
  const now = Date.now()
  if (channelsCache && now < cacheExpiry) return channelsCache

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('price_channels')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error || !data) {
    console.error('Error fetching price channels:', error)
    // Fallback a coeficientes por defecto
    return [
      { id: '', slug: 'physical', name: 'Tienda física', coefficient: 0.95, is_active: true, sort_order: 1, updated_at: '' },
      { id: '', slug: 'online', name: 'Tienda online', coefficient: 1.05, is_active: true, sort_order: 2, updated_at: '' },
      { id: '', slug: 'discogs', name: 'Discogs', coefficient: 1.10, is_active: true, sort_order: 3, updated_at: '' },
    ]
  }

  channelsCache = data as PriceChannel[]
  cacheExpiry = now + CACHE_TTL
  return channelsCache!
}

export function calculateChannelPrice(basePrice: number, coefficient: number): number {
  // Redondear a 2 decimales (centimos) usando redondeo comercial
  const raw = basePrice * coefficient
  return Math.round(raw * 100) / 100
}

export async function getOnlinePrice(basePrice: number): Promise<number> {
  const channels = await getPriceChannels()
  const online = channels.find(c => c.slug === 'online')
  return calculateChannelPrice(basePrice, online?.coefficient ?? 1.05)
}

export async function getPhysicalPrice(basePrice: number): Promise<number> {
  const channels = await getPriceChannels()
  const physical = channels.find(c => c.slug === 'physical')
  return calculateChannelPrice(basePrice, physical?.coefficient ?? 0.95)
}

export async function getDiscogsPrice(basePrice: number): Promise<number> {
  const channels = await getPriceChannels()
  const discogs = channels.find(c => c.slug === 'discogs')
  return calculateChannelPrice(basePrice, discogs?.coefficient ?? 1.10)
}

// IVA superreducido para vinilos en España: 4%
export const VAT_RATE = 0.04

export function calculateVAT(price: number): number {
  return Math.round(price * VAT_RATE * 100) / 100
}

export function priceWithVAT(price: number): number {
  return Math.round(price * (1 + VAT_RATE) * 100) / 100
}

// Invalidar cache cuando se actualizan coeficientes desde admin
export function invalidatePriceCache() {
  channelsCache = null
  cacheExpiry = 0
}
