// lib/stripe-utils.ts
// Utilidades para crear Checkout Sessions de Stripe

import { getStripe, isStripeTestMode } from './stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPriceChannels, calculateChannelPrice, VAT_RATE } from './pricing'
import type { CartItem } from '@/context/CartContext'
import type { ShippingRate } from '@/types'

interface CheckoutParams {
  items: CartItem[]
  shippingRate?: ShippingRate | null
  customerEmail?: string
  userId?: string
  channel?: string
  originUrl: string
}

interface CheckoutResult {
  sessionId: string
  url: string
}

export async function createCheckoutSession({
  items,
  shippingRate,
  customerEmail,
  userId,
  channel = 'online',
  originUrl,
}: CheckoutParams): Promise<CheckoutResult> {
  const stripe = getStripe()
  const supabase = createAdminClient()

  // Obtener coeficiente de precio del canal online
  const channels = await getPriceChannels()
  const onlineChannel = channels.find(c => c.slug === channel)
  const coefficient = onlineChannel?.coefficient ?? 1.05

  // Construir line_items para Stripe
  const lineItems = items.map(item => {
    const channelPrice = calculateChannelPrice(item.price, coefficient)
    // IVA incluido en el precio mostrado (reverse calculation)
    const priceWithoutVAT = Math.round(channelPrice / (1 + VAT_RATE) * 100) / 100

    return {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${item.artists[0] ?? '—'} — ${item.title}`,
          description: [
            item.condition,
            item.format,
            item.labels?.[0],
          ].filter(Boolean).join(' · '),
          images: item.cover_image ? [item.cover_image] : [],
          metadata: {
            release_id: item.id,
            discogs_listing_id: String(item.discogs_listing_id),
          },
        },
        unit_amount: Math.round(channelPrice * 100), // Stripe usa centimos
        tax_behavior: 'inclusive' as const, // IVA incluido en el precio
      },
      quantity: 1, // Cada vinilo es único
    }
  })

  // Añadir envío como line item si aplica
  if (shippingRate && shippingRate.price > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Envío: ${shippingRate.name}`,
          description: shippingRate.description || '',
          images: [] as string[],
          metadata: {
            release_id: 'shipping',
            discogs_listing_id: '0',
          },
        },
        unit_amount: Math.round(shippingRate.price * 100),
        tax_behavior: 'inclusive' as const,
      },
      quantity: 1,
    })
  }

  // Generar order_number
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

  // Generar pickup_code si es Click & Collect
  const isClickCollect = shippingRate?.method === 'click_collect'
  const pickupCode = isClickCollect
    ? `RC-${Math.floor(10000 + Math.random() * 90000)}`
    : undefined

  // Calcular totales
  const subtotal = items.reduce((sum, item) => {
    return sum + calculateChannelPrice(item.price, coefficient)
  }, 0)
  const shippingCost = shippingRate?.price ?? 0
  const total = subtotal + shippingCost

  // Crear orden en Supabase antes de redirigir a Stripe
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId || null,
      customer_email: customerEmail || '',
      customer_name: '',
      shipping_address: shippingRate?.method !== 'click_collect' ? {} : null,
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
      status: 'created',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Error creating order:', orderError)
    throw new Error('No se pudo crear el pedido')
  }

  // Guardar order_items
  const orderItems = items.map(item => ({
    order_id: order.id,
    release_id: item.id,
    title: item.title,
    artists: item.artists,
    condition: item.condition,
    cover_image: item.cover_image,
    price_base: item.price,
    price_channel: calculateChannelPrice(item.price, coefficient),
    quantity: 1,
  }))

  await supabase.from('order_items').insert(orderItems)

  // Marcar releases como reservados
  const releaseIds = items.map(i => i.id)
  await supabase.from('releases').update({ status: 'reserved' }).in('id', releaseIds)

  // Crear sesión de Stripe Checkout
  const sessionParams: Record<string, any> = {
    mode: 'payment',
    line_items: lineItems,
    success_url: `${originUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${originUrl}/checkout/cancel?order=${orderNumber}`,
    client_reference_id: order.id,
    metadata: {
      order_id: order.id,
      order_number: orderNumber,
      pickup_code: pickupCode || '',
      price_channel: channel,
    },
    payment_method_types: isStripeTestMode()
      ? ['card'] // En test solo card
      : ['card', 'ideal', 'bancontact'], // En prod más métodos
    allow_promotion_codes: false,
    billing_address_collection: 'auto',
    shipping_address_collection: shippingRate?.method !== 'click_collect'
      ? { allowed_countries: ['ES', 'PT', 'FR', 'DE', 'IT', 'GB', 'NL', 'BE'] }
      : undefined,
  }

  if (customerEmail) {
    sessionParams.customer_email = customerEmail
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  // Actualizar orden con stripe_session_id
  await supabase
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id)

  return {
    sessionId: session.id,
    url: session.url!,
  }
}
