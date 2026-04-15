// app/api/checkout/sessions/route.ts
// POST — Crear sesión de Stripe Checkout

import { createCheckoutSession } from '@/lib/stripe-utils'
import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/context/CartContext'
import type { ShippingRate } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, shippingRateId, channel } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    // Verificar stock disponible
    const supabase = await createClient()
    const releaseIds = items.map((i: CartItem) => i.id)
    const { data: releases } = await supabase
      .from('releases')
      .select('id, status, quantity')
      .in('id', releaseIds)

    for (const item of items) {
      const release = releases?.find((r: any) => r.id === item.id)
      if (!release || release.status !== 'active') {
        return Response.json({
          error: `"${item.artists[0]} — ${item.title}" ya no está disponible`,
        }, { status: 409 })
      }
    }

    // Obtener tarifa de envío si se proporciona
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

    // Obtener usuario si está autenticado
    const { data: { user } } = await supabase.auth.getUser()

    // URL de origen para las URLs de Stripe
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const result = await createCheckoutSession({
      items: items as CartItem[],
      shippingRate,
      customerEmail: user?.email || undefined,
      userId: user?.id,
      channel: channel || 'online',
      originUrl: origin,
    })

    return Response.json({
      sessionId: result.sessionId,
      url: result.url,
    })
  } catch (err: any) {
    console.error('Checkout session error:', err)
    return Response.json(
      { error: err.message || 'Error al crear la sesión de checkout' },
      { status: 500 }
    )
  }
}
