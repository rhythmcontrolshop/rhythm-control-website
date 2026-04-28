'use client'

// app/checkout/page.tsx
// Página de checkout mínima — recoge datos del cliente antes de redirigir a Redsys TPV
// Si el usuario está logueado, precarga datos del perfil

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { ShippingRate } from '@/types'

interface ProfileData {
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  province: string | null
  country_code: string | null
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart() as any
  const router = useRouter()

  // ── Form state ────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [countryCode, setCountryCode] = useState('ES')

  // ── Shipping ──────────────────────────────────────────────────
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<string>('')
  const [isGUARDI, setIsGUARDI] = useState(true)

  // ── Payment ───────────────────────────────────────────────────
  const [payMethod, setPayMethod] = useState<'card' | 'bizum'>('card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Redirigir si carrito vacío ────────────────────────────────
  useEffect(() => {
    if (items.length === 0) {
      router.push('/stock')
    }
  }, [items.length, router])

  // ── Cargar perfil del usuario si está logueado ───────────────
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/cuenta/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            const p: ProfileData = data.profile
            if (p.first_name || p.last_name) {
              setCustomerName(`${p.first_name ?? ''} ${p.last_name ?? ''}`.trim())
            }
            if (p.email) setCustomerEmail(p.email)
            if (p.phone) setCustomerPhone(p.phone)
            if (p.address) setAddress(p.address)
            if (p.postal_code) setPostalCode(p.postal_code)
            if (p.city) setCity(p.city)
            if (p.province) setProvince(p.province)
            if (p.country_code) setCountryCode(p.country_code)
          }
        }
      } catch {
        // No hay perfil — formulario vacío
      }
    }
    loadProfile()
  }, [])

  // ── Cargar tarifas de envío ───────────────────────────────────
  useEffect(() => {
    async function loadShipping() {
      try {
        const res = await fetch('/api/shipping-rates')
        if (res.ok) {
          const data = await res.json()
          setShippingRates(data.rates || [])
          // Seleccionar GUARDI por defecto
          const guardi = data.rates?.find((r: ShippingRate) => r.method === 'click_collect')
          if (guardi) {
            setSelectedRate(guardi.id)
            setIsGUARDI(true)
          } else if (data.rates?.length > 0) {
            setSelectedRate(data.rates[0].id)
            setIsGUARDI(data.rates[0].method === 'click_collect')
          }
        }
      } catch { /* ignore */ }
    }
    loadShipping()
  }, [])

  // ── Manejar cambio de tarifa ──────────────────────────────────
  function handleShippingChange(rateId: string) {
    setSelectedRate(rateId)
    const rate = shippingRates.find(r => r.id === rateId)
    setIsGUARDI(rate?.method === 'click_collect')
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validaciones básicas
    if (!customerName.trim()) { setError('El nombre es obligatorio'); return }
    if (!customerEmail.trim()) { setError('El email es obligatorio'); return }
    if (!customerPhone.trim()) { setError('El teléfono es obligatorio'); return }

    if (!isGUARDI) {
      if (!address.trim()) { setError('La dirección es obligatoria para envío'); return }
      if (!postalCode.trim()) { setError('El código postal es obligatorio'); return }
      if (!city.trim()) { setError('La ciudad es obligatoria'); return }
    }

    if (!selectedRate) { setError('Selecciona un método de envío'); return }

    setLoading(true)

    try {
      const res = await fetch('/api/checkout/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i: any) => ({
            id: i.id,
            discogs_listing_id: i.discogs_listing_id,
            title: i.title,
            artists: i.artists,
            condition: i.condition,
            format: i.format,
            labels: i.labels,
            cover_image: i.cover_image,
            price: i.price,
            quantity: i.quantity,
          })),
          shippingRateId: selectedRate,
          channel: 'online',
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          shippingAddress: !isGUARDI ? {
            address: address.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            province: province.trim(),
            countryCode,
          } : null,
          payMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al procesar el pago')
        return
      }

      // Crear formulario oculto y enviar a Redsys
      const form = document.createElement('form')
      form.setAttribute('method', 'POST')
      form.setAttribute('action', data.redsys.action)
      form.setAttribute('style', 'display: none')

      const fields = {
        Ds_SignatureVersion: data.redsys.Ds_SignatureVersion,
        Ds_MerchantParameters: data.redsys.Ds_MerchantParameters,
        Ds_Signature: data.redsys.Ds_Signature,
      }

      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement('input')
        input.setAttribute('type', 'hidden')
        input.setAttribute('name', name)
        input.setAttribute('value', value)
        form.appendChild(input)
      }

      document.body.appendChild(form)
      form.submit()

    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const selectedShippingRate = shippingRates.find(r => r.id === selectedRate)
  const shippingCost = selectedShippingRate?.price ?? 0
  const grandTotal = totalPrice + shippingCost

  if (items.length === 0) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000' }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl uppercase" style={{ color: '#FFF', letterSpacing: '-0.05em' }}>
            CHECKOUT
          </h1>
          <button
            onClick={() => router.push('/stock')}
            className="font-display text-xs min-h-[44px] flex items-center"
            style={{ color: '#999', cursor: 'pointer' }}
          >
            ← VOLVER
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Resumen del pedido ─────────────────────────────── */}
          <div className="p-4" style={{ border: '1px solid #333' }}>
            <h2 className="font-display text-xs uppercase mb-3" style={{ color: '#F0E040' }}>
              TU PEDIDO ({items.length})
            </h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {items.map((item: any) => (
                <div key={item.discogs_listing_id} className="flex items-center gap-3">
                  <div className="w-10 h-10 relative flex-shrink-0 border border-gray-700 bg-gray-900">
                    <Image
                      src={item.cover_image || '/placeholder.png'}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs uppercase truncate" style={{ color: '#FFF' }}>
                      {item.artists?.[0]} — {item.title}
                    </p>
                  </div>
                  <span className="font-display text-xs flex-shrink-0" style={{ color: '#FFF' }}>
                    {(item.price * (item.quantity || 1)).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between">
              <span className="font-display text-sm" style={{ color: '#FFF' }}>TOTAL</span>
              <span className="font-display text-sm" style={{ color: '#F0E040' }}>{totalPrice.toFixed(2)} €</span>
            </div>
          </div>

          {/* ── Método de envío ─────────────────────────────────── */}
          <div>
            <h2 className="font-display text-xs uppercase mb-3" style={{ color: '#F0E040' }}>
              MÉTODO DE ENVÍO
            </h2>
            <div className="space-y-2">
              {shippingRates.map(rate => (
                <label
                  key={rate.id}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  style={{
                    border: selectedRate === rate.id ? '2px solid #F0E040' : '1px solid #333',
                    backgroundColor: selectedRate === rate.id ? 'rgba(240, 224, 64, 0.05)' : 'transparent',
                    minHeight: '44px',
                  }}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={rate.id}
                    checked={selectedRate === rate.id}
                    onChange={() => handleShippingChange(rate.id)}
                    className="accent-[#F0E040]"
                  />
                  <div className="flex-1">
                    <p className="font-display text-xs" style={{ color: '#FFF' }}>
                      {rate.method === 'click_collect' ? 'GUARDI (Click&Collect)' : rate.name}
                    </p>
                    {rate.description && (
                      <p className="font-mono text-xs mt-0.5" style={{ color: '#666' }}>{rate.description}</p>
                    )}
                  </div>
                  <span className="font-display text-xs" style={{ color: '#FFF' }}>
                    {rate.price === 0 ? 'GRATIS' : `${rate.price.toFixed(2)} €`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Datos personales ────────────────────────────────── */}
          <div>
            <h2 className="font-display text-xs uppercase mb-3" style={{ color: '#F0E040' }}>
              TUS DATOS
            </h2>
            <div className="space-y-3">
              <div>
                <label className="font-mono text-xs block mb-1" style={{ color: '#999' }}>Nombre completo *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full bg-transparent font-mono text-sm focus:outline-none"
                  style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="font-mono text-xs block mb-1" style={{ color: '#999' }}>Email *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent font-mono text-sm focus:outline-none"
                  style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="font-mono text-xs block mb-1" style={{ color: '#999' }}>Teléfono *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  className="w-full bg-transparent font-mono text-sm focus:outline-none"
                  style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                  placeholder="+34 6XX XXX XXX"
                />
              </div>
            </div>
          </div>

          {/* ── Dirección de envío (solo si no es GUARDI) ───────── */}
          {!isGUARDI && (
            <div>
              <h2 className="font-display text-xs uppercase mb-3" style={{ color: '#F0E040' }}>
                DIRECCIÓN DE ENVÍO
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-xs block mb-1" style={{ color: '#999' }}>Dirección *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required={!isGUARDI}
                    autoComplete="street-address"
                    className="w-full bg-transparent font-mono text-sm focus:outline-none"
                    style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                    placeholder="Calle, número, piso..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-xs block mb-1" style={{ color: '#999' }}>C.P. *</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      required={!isGUARDI}
                      autoComplete="postal-code"
                      className="w-full bg-transparent font-mono text-sm focus:outline-none"
                      style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                      placeholder="08001"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs block mb-1" style={{ color: '#999' }}>Ciudad *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      required={!isGUARDI}
                      autoComplete="address-level2"
                      className="w-full bg-transparent font-mono text-sm focus:outline-none"
                      style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                      placeholder="Barcelona"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-mono text-xs block mb-1" style={{ color: '#999' }}>Provincia</label>
                  <input
                    type="text"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    autoComplete="address-level1"
                    className="w-full bg-transparent font-mono text-sm focus:outline-none"
                    style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                    placeholder="Barcelona"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Método de pago ──────────────────────────────────── */}
          <div>
            <h2 className="font-display text-xs uppercase mb-3" style={{ color: '#F0E040' }}>
              MÉTODO DE PAGO
            </h2>
            <div className="space-y-2">
              <label
                className="flex items-center gap-3 p-3 cursor-pointer"
                style={{
                  border: payMethod === 'card' ? '2px solid #F0E040' : '1px solid #333',
                  backgroundColor: payMethod === 'card' ? 'rgba(240, 224, 64, 0.05)' : 'transparent',
                  minHeight: '44px',
                }}
              >
                <input
                  type="radio"
                  name="payMethod"
                  checked={payMethod === 'card'}
                  onChange={() => setPayMethod('card')}
                  className="accent-[#F0E040]"
                />
                <div className="flex-1">
                  <p className="font-display text-xs" style={{ color: '#FFF' }}>TARJETA</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: '#666' }}>Visa, Mastercard, etc.</p>
                </div>
              </label>
              <label
                className="flex items-center gap-3 p-3 cursor-pointer"
                style={{
                  border: payMethod === 'bizum' ? '2px solid #F0E040' : '1px solid #333',
                  backgroundColor: payMethod === 'bizum' ? 'rgba(240, 224, 64, 0.05)' : 'transparent',
                  minHeight: '44px',
                }}
              >
                <input
                  type="radio"
                  name="payMethod"
                  checked={payMethod === 'bizum'}
                  onChange={() => setPayMethod('bizum')}
                  className="accent-[#F0E040]"
                />
                <div className="flex-1">
                  <p className="font-display text-xs" style={{ color: '#FFF' }}>BIZUM</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: '#666' }}>Pago instantáneo</p>
                </div>
              </label>
            </div>
          </div>

          {/* ── Total y botón de pago ───────────────────────────── */}
          <div className="p-4" style={{ border: '2px solid #F0E040' }}>
            <div className="flex justify-between mb-1">
              <span className="font-mono text-xs" style={{ color: '#999' }}>Subtotal</span>
              <span className="font-mono text-xs" style={{ color: '#FFF' }}>{totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="font-mono text-xs" style={{ color: '#999' }}>
                Envío {isGUARDI ? '(GUARDI)' : ''}
              </span>
              <span className="font-mono text-xs" style={{ color: '#FFF' }}>
                {shippingCost === 0 ? 'GRATIS' : `${shippingCost.toFixed(2)} €`}
              </span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-display text-base" style={{ color: '#FFF' }}>TOTAL</span>
              <span className="font-display text-base" style={{ color: '#F0E040' }}>{grandTotal.toFixed(2)} €</span>
            </div>

            {error && (
              <p className="font-mono text-xs mb-3" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full font-display text-sm uppercase py-4 min-h-[52px] transition-colors duration-200"
              style={{
                backgroundColor: loading ? '#666' : '#F0E040',
                color: '#000',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'PROCESANDO...' : payMethod === 'bizum' ? 'PAGAR CON BIZUM' : 'PAGAR CON TARJETA'}
            </button>

            <p className="font-mono text-xs text-center mt-3" style={{ color: '#666' }}>
              Serás redirigido a la pasarela de pago segura de Redsys
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
