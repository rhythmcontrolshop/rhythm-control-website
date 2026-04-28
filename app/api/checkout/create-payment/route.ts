// app/api/checkout/create-payment/route.ts
// POST — Crear orden en DB y generar parámetros firmados para Redsys TPV

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createPaymentParameters, eurosToCents, generateRedsysOrderReference } from '@/lib/redsys'
import { getPriceChannels, calculateChannelPrice, VAT_RATE } from '@/lib/pricing'
import type { CartItem } from '@/context/CartContext'
import type { ShippingRate } from '@/types'

// ─── Schema de validación ───────────────────────────────────────────────────

const CartItemSchema = z.object({
  id: z.string().uuid(),
  discogs_listing_id: z.number().int(),
  title: z.string().min(1).max(500),
  artists: z.array(z.string()).min(1),
  price: z.number().positive(),
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
  // Datos del cliente (obligatorios)
  customerName: z.string().min(2).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(6).max(30),
  // Dirección de envío (obligatoria si no es GUARDI)
  shippingAddress: z.object({
    address: z.string().min(3).max(300),
    city: z.string().min(2).max(200),
    postalCode: z.string().min(4).max(10),
    province: z.string().optional(),
    countryCode: z.string().default('ES'),
  }).nullable().optional(),
  // Método de pago
  payMethod: z.enum(['card', 'bizum']).default('card'),
})

export async function POST(request: Request) {
  try {
    const raw = await request.json()
    const parsed = CheckoutBodySchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({
        error: 'Datos del formulario inválidos',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 })
    }

    const {
      items, shippingRateId, channel,
      customerName, customerEmail, customerPhone,
      shippingAddress, payMethod,
    } = parsed.data

    const supabase = createAdminClient()
    const userClient = await createClient()

    // ── 1. Verificar usuario (opcional — invitado permitido) ──────
    const { data: { user } } = await userClient.auth.getUser()
    const userId = user?.id ?? null

    // ── 2. Validar items contra la BD ─────────────────────────────
    const { data: releases } = await supabase
      .from('releases')
      .select('id, price, status')
      .in('id', items.map(i => i.id))

    const rejectedItems: string[] = []
    const trustedItems: CartItem[] = []

    for (const item of items) {
      const db = releases?.find(r => r.id === item.id)
      if (!db || db.price === null || db.price === undefined) {
        rejectedItems.push(item.title || item.id)
        continue
      }
      if (db.status !== 'active') {
        rejectedItems.push(item.title || item.id)
        continue
      }
      trustedItems.push({ ...item, price: db.price } as CartItem)
    }

    if (trustedItems.length === 0) {
      return Response.json({
        error: 'Ninguno de los artículos del carrito está disponible',
        rejected: rejectedItems,
      }, { status: 400 })
    }

    // ── 3. Reserva atómica de stock ───────────────────────────────
    const releaseIds = trustedItems.map(i => i.id)
    const { data: reservation } = await supabase.rpc('reserve_releases', {
      p_release_ids: releaseIds,
    })

    if (!reservation?.ok) {
      return Response.json({
        error: 'Uno o más discos ya no están disponibles',
      }, { status: 409 })
    }

    try {
      // ── 4. Precios por canal ────────────────────────────────────
      const channels = await getPriceChannels()
      const onlineChannel = channels.find(c => c.slug === channel)
      const coefficient = onlineChannel?.coefficient ?? 1.05

      // ── 5. Obtener tarifa de envío ──────────────────────────────
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

      const isGUARDI = shippingRate?.method === 'click_collect'

      // Validar que dirección esté presente si no es GUARDI
      if (!isGUARDI && !shippingAddress) {
        return Response.json({
          error: 'La dirección de envío es obligatoria para envío a domicilio',
        }, { status: 400 })
      }

      // ── 6. Generar número de orden ──────────────────────────────
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let orderNum = 1
      if (lastOrder?.order_number) {
        const match = lastOrder.order_number.match(/RC-(\d{5})/)
        if (match) orderNum = parseInt(match[1], 10) + 1
      }
      const orderNumber = `RC-${String(orderNum).padStart(5, '0')}`

      // ── 7. Código de recogida para GUARDI ───────────────────────
      const pickupCode = isGUARDI
        ? `RC-${Math.floor(10000 + Math.random() * 90000)}`
        : undefined

      // ── 8. Cálculos ─────────────────────────────────────────────
      const subtotal = trustedItems.reduce(
        (sum, item) => sum + calculateChannelPrice(item.price, coefficient) * item.quantity,
        0
      )
      const shippingCost = shippingRate?.price ?? 0
      const total = subtotal + shippingCost

      // ── 9. Crear orden en Supabase ──────────────────────────────
      const redsysOrderRef = generateRedsysOrderReference(orderNumber)

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userId,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          shipping_address: !isGUARDI && shippingAddress ? {
            address: shippingAddress.address,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            province: shippingAddress.province ?? '',
            countryCode: shippingAddress.countryCode ?? 'ES',
          } : null,
          shipping_method: shippingRate?.method ?? null,
          shipping_rate_id: shippingRate?.id ?? null,
          shipping_cost: shippingCost,
          price_channel: channel,
          subtotal,
          tax_rate: VAT_RATE,
          tax_amount: Math.round(subtotal * VAT_RATE / (1 + VAT_RATE) * 100) / 100,
          total,
          pickup_code: pickupCode,
          payment_status: 'pending',
          payment_provider: 'redsys',
          status: 'created',
          redsys_order_ref: redsysOrderRef,
        })
        .select('id')
        .single()

      if (orderError || !order) {
        console.error('Order creation error:', orderError)
        throw new Error('No se pudo crear el pedido')
      }

      // ── 10. Order items ─────────────────────────────────────────
      await supabase.from('order_items').insert(
        trustedItems.map(item => ({
          order_id: order.id,
          release_id: item.id,
          title: item.title,
          artists: item.artists,
          condition: item.condition,
          cover_image: item.cover_image,
          price_base: item.price,
          price_channel: calculateChannelPrice(item.price, coefficient),
          quantity: item.quantity,
        }))
      )

      // ── 11. Generar parámetros Redsys ───────────────────────────
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      const origin = request.headers.get('origin') ?? siteUrl ?? 'http://localhost:3000'

      const redsysParams = createPaymentParameters({
        amount: eurosToCents(total),
        orderReference: redsysOrderRef,
        merchantName: 'RHYTHM CONTROL',
        successURL: `${origin}/checkout/success?order=${orderNumber}`,
        errorURL: `${origin}/checkout/failure?order=${orderNumber}`,
        merchantURL: `${origin}/api/webhooks/redsys`,
        payMethod: payMethod,
      })

      // ── 12. Actualizar orden con referencia Redsys ──────────────
      await supabase
        .from('orders')
        .update({
          redsys_order_ref: redsysOrderRef,
        })
        .eq('id', order.id)

      return Response.json({
        orderId: order.id,
        orderNumber,
        redsys: redsysParams,
      })

    } catch (err) {
      // Liberar stock reservado si falla
      await supabase.rpc('unreserve_releases', { p_release_ids: releaseIds })
      throw err
    }

  } catch (err: any) {
    console.error('Checkout create-payment error:', err)
    const status = err.status === 409 ? 409 : 500
    const message = err.status === 409
      ? err.message
      : 'Error al procesar el pago'
    return Response.json({ error: message }, { status })
  }
}
