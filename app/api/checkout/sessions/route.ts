// app/api/checkout/sessions/route.ts
// POST — Crear sesión de Stripe Checkout

import { z } from 'zod'
import { createCheckoutSession } from '@/lib/stripe-utils'
import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/context/CartContext'
import type { ShippingRate } from '@/types'

const CartItemSchema = z.object({
  id: z.string().uuid(),
  discogs_listing_id: z.number().int(),
  title: z.string().min(1).max(500),
  artists: z.array(z.string()).min(1),
  price: z.number().positive(),        // sobreescrito con precio de DB en stripe-utils
  condition: z.string().optional(),
  format: z.string().optional(),
  labels: z.array(z.string()).optional(),
  cover_image: z.string().optional(),
  quantity: z.number().int().positive(),
})

const CheckoutBodySchema = z.object({
  items: z.array(CartItemSchema).min(1).max(20),
  shippingRateId: z.string().uuid().nullable().optional(),
  channel: z.enum(['online', 'physical', 'discogs']).default('online'),
})

export async function POST(request: Request) {
  try {
    const raw = await request.json()
    const parsed = CheckoutBodySchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({ error: 'Datos del carrito inválidos' }, { status: 400 })
    }

    const { items, shippingRateId, channel } = parsed.data
    const supabase = await createClient()

    // Obtener precios autoritativos desde DB (evita price tampering del cliente)
    const { data: releases } = await supabase
      .from('releases')
      .select('id, price')
      .in('id', items.map(i => i.id))

    const trustedItems: CartItem[] = items.map(item => {
      const db = releases?.find(r => r.id === item.id)
      return { ...item, price: db?.price ?? item.price } as CartItem
    })

    // Verificar tarifa de envío
    let shippingRate: ShippingRate | null = null
    if (shippingRateId) {
      const { data: rate } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('id', shippingRateId)
        .eq('is_active', true)
        .single()
      shippingRate = rate as ShippingRate | null
    }

    const { data: { user } } = await supabase.auth.getUser()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const origin = request.headers.get('origin') ?? siteUrl
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return Response.json({ error: 'NEXT_PUBLIC_SITE_URL no configurado' }, { status: 500 })
      }
      // dev fallback only
    }
    const resolvedOrigin = origin ?? 'http://localhost:3000'

    const result = await createCheckoutSession({
      items: trustedItems,
      shippingRate,
      customerEmail: user?.email,
      userId: user?.id,
      channel,
      originUrl: resolvedOrigin,
    })

    return Response.json({ sessionId: result.sessionId, url: result.url })
  } catch (err: any) {
    console.error('Checkout session error:', err)
    const status = err.status === 409 ? 409 : 500
    const message = err.status === 409
      ? err.message
      : 'Error al crear la sesión de checkout'
    return Response.json({ error: message }, { status })
  }
}
