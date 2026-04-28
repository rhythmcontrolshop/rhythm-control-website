'use client'

// app/checkout/page.tsx
// Página de checkout — recoge datos del cliente antes de redirigir a Redsys TPV
// Si el usuario está logueado, precarga datos del perfil
// Color scheme: blue (#3B82F6) accents on black background

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { ShippingRate } from '@/types'

// ─── Color constants ────────────────────────────────────────────────────────
const BLUE      = '#3B82F6'
const BLUE_DIM  = 'rgba(59, 130, 246, 0.08)'
const BLUE_MID  = 'rgba(59, 130, 246, 0.15)'
const WHITE     = '#FFFFFF'
const GRAY      = '#999999'
const GRAY_DARK = '#666666'
const BORDER    = '#333333'
const BG        = '#000000'

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
  const { t } = useLocale()

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

  // ── Redirect if empty cart ────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) {
      router.push('/stock')
    }
  }, [items.length, router])

  // ── Load user profile ─────────────────────────────────────────
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
        // No profile — empty form
      }
    }
    loadProfile()
  }, [])

  // ── Load shipping rates ───────────────────────────────────────
  useEffect(() => {
    async function loadShipping() {
      try {
        const res = await fetch('/api/shipping-rates')
        if (res.ok) {
          const data = await res.json()
          setShippingRates(data.rates || [])
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

  // ── Handle shipping change ────────────────────────────────────
  function handleShippingChange(rateId: string) {
    setSelectedRate(rateId)
    const rate = shippingRates.find(r => r.id === rateId)
    setIsGUARDI(rate?.method === 'click_collect')
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!customerName.trim()) { setError(t('checkout.nameRequired')); return }
    if (!customerEmail.trim()) { setError(t('checkout.emailRequired')); return }
    if (!customerPhone.trim()) { setError(t('checkout.phoneRequired')); return }

    if (!isGUARDI) {
      if (!address.trim()) { setError(t('checkout.addressRequired')); return }
      if (!postalCode.trim()) { setError(t('checkout.postalCodeRequired')); return }
      if (!city.trim()) { setError(t('checkout.cityRequired')); return }
    }

    if (!selectedRate) { setError(t('checkout.selectShipping')); return }

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

      // Try to parse JSON, but handle non-JSON responses gracefully
      let data: any
      try {
        data = await res.json()
      } catch {
        setError(t('checkout.serverError'))
        return
      }

      if (!res.ok) {
        setError(data.error || t('checkout.paymentError'))
        return
      }

      // Create hidden form and submit to Redsys
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

      // Attempt form submission — CSP or network issues may block it
      try {
        form.submit()
      } catch (submitErr) {
        // Form submission failed (likely CSP blocking the redirect)
        // Cleanup: unreserve the items so they can be re-attempted
        console.error('Redsys form submission failed:', submitErr)
        try {
          await fetch('/api/checkout/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemIds: items.map((i: any) => i.id) }),
          })
        } catch { /* cleanup failed, ignore */ }
        setError(t('checkout.connectionError'))
        setLoading(false)
        return
      }

    } catch (err) {
      console.error('Checkout error:', err)
      // Cleanup: try to unreserve items so they can be re-attempted
      try {
        await fetch('/api/checkout/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemIds: items.map((i: any) => i.id) }),
        })
      } catch { /* cleanup failed, ignore */ }
      setError(t('checkout.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  const selectedShippingRate = shippingRates.find(r => r.id === selectedRate)
  const shippingCost = selectedShippingRate?.price ?? 0
  const grandTotal = totalPrice + shippingCost

  if (items.length === 0) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-xl uppercase" style={{ color: WHITE, letterSpacing: '-0.05em' }}>
            {t('checkout.title')}
          </h1>
          <button
            onClick={() => router.push('/stock')}
            className="font-display text-xs min-h-[44px] flex items-center"
            style={{ color: GRAY, cursor: 'pointer' }}
          >
            {t('checkout.back')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Order summary ────────────────────────────────── */}
          <div className="p-4" style={{ border: `1px solid ${BORDER}` }}>
            <h2 className="font-display text-xs uppercase mb-4" style={{ color: BLUE }}>
              {t('checkout.yourOrder')} ({items.length})
            </h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {items.map((item: any) => (
                <div key={item.discogs_listing_id} className="flex items-center gap-3">
                  <div className="w-12 h-12 relative flex-shrink-0" style={{ border: `1px solid ${BORDER}`, backgroundColor: '#111' }}>
                    <Image
                      src={item.cover_image || '/placeholder.png'}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs uppercase truncate" style={{ color: WHITE }}>
                      {item.artists?.[0]} — {item.title}
                    </p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: GRAY_DARK }}>
                      {item.condition} · {item.format}
                    </p>
                  </div>
                  <span className="font-display text-xs flex-shrink-0" style={{ color: WHITE }}>
                    {(item.price * (item.quantity || 1)).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 flex justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span className="font-display text-sm" style={{ color: WHITE }}>{t('checkout.subtotal')}</span>
              <span className="font-display text-sm" style={{ color: BLUE }}>{totalPrice.toFixed(2)} €</span>
            </div>
          </div>

          {/* ── Shipping method ──────────────────────────────── */}
          <div>
            <h2 className="font-display text-xs uppercase mb-4" style={{ color: BLUE }}>
              {t('checkout.shippingMethod')}
            </h2>
            <div className="space-y-2">
              {shippingRates.map(rate => (
                <label
                  key={rate.id}
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  style={{
                    border: selectedRate === rate.id ? `2px solid ${BLUE}` : `1px solid ${BORDER}`,
                    backgroundColor: selectedRate === rate.id ? BLUE_DIM : 'transparent',
                    minHeight: '44px',
                  }}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={rate.id}
                    checked={selectedRate === rate.id}
                    onChange={() => handleShippingChange(rate.id)}
                    className="accent-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-display text-xs" style={{ color: WHITE }}>
                      {rate.method === 'click_collect' ? t('checkout.guardi') : rate.name}
                    </p>
                    {rate.description && (
                      <p className="font-mono text-xs mt-1" style={{ color: GRAY_DARK }}>{rate.description}</p>
                    )}
                  </div>
                  <span className="font-display text-xs" style={{ color: WHITE }}>
                    {rate.price === 0 ? t('checkout.free') : `${rate.price.toFixed(2)} €`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Customer info ────────────────────────────────── */}
          <div>
            <h2 className="font-display text-xs uppercase mb-4" style={{ color: BLUE }}>
              {t('checkout.yourData')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs block mb-2" style={{ color: GRAY }}>{t('checkout.fullName')}</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ border: `1px solid ${BORDER}`, color: WHITE, padding: '12px' }}
                  placeholder={t('checkout.namePlaceholder')}
                />
              </div>
              <div>
                <label className="font-mono text-xs block mb-2" style={{ color: GRAY }}>{t('checkout.emailLabel')}</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ border: `1px solid ${BORDER}`, color: WHITE, padding: '12px' }}
                  placeholder={t('checkout.emailPlaceholder')}
                />
              </div>
              <div>
                <label className="font-mono text-xs block mb-2" style={{ color: GRAY }}>{t('checkout.phoneLabel')}</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ border: `1px solid ${BORDER}`, color: WHITE, padding: '12px' }}
                  placeholder={t('checkout.phonePlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* ── Shipping address (only if not GUARDI) ────────── */}
          {!isGUARDI && (
            <div>
              <h2 className="font-display text-xs uppercase mb-4" style={{ color: BLUE }}>
                {t('checkout.shippingAddress')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-xs block mb-2" style={{ color: GRAY }}>{t('checkout.addressLabel')}</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required={!isGUARDI}
                    autoComplete="street-address"
                    className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ border: `1px solid ${BORDER}`, color: WHITE, padding: '12px' }}
                    placeholder={t('checkout.addressPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs block mb-2" style={{ color: GRAY }}>{t('checkout.postalCodeLabel')}</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      required={!isGUARDI}
                      autoComplete="postal-code"
                      className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ border: `1px solid ${BORDER}`, color: WHITE, padding: '12px' }}
                      placeholder={t('checkout.postalCodePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs block mb-2" style={{ color: GRAY }}>{t('checkout.cityLabel')}</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      required={!isGUARDI}
                      autoComplete="address-level2"
                      className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ border: `1px solid ${BORDER}`, color: WHITE, padding: '12px' }}
                      placeholder={t('checkout.cityPlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="font-mono text-xs block mb-2" style={{ color: GRAY }}>{t('checkout.provinceLabel')}</label>
                  <input
                    type="text"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    autoComplete="address-level1"
                    className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ border: `1px solid ${BORDER}`, color: WHITE, padding: '12px' }}
                    placeholder={t('checkout.provincePlaceholder')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Payment method ───────────────────────────────── */}
          <div>
            <h2 className="font-display text-xs uppercase mb-4" style={{ color: BLUE }}>
              {t('checkout.paymentMethod')}
            </h2>
            <div className="space-y-2">
              <label
                className="flex items-center gap-3 p-4 cursor-pointer"
                style={{
                  border: payMethod === 'card' ? `2px solid ${BLUE}` : `1px solid ${BORDER}`,
                  backgroundColor: payMethod === 'card' ? BLUE_DIM : 'transparent',
                  minHeight: '44px',
                }}
              >
                <input
                  type="radio"
                  name="payMethod"
                  checked={payMethod === 'card'}
                  onChange={() => setPayMethod('card')}
                  className="accent-blue-500"
                />
                <div className="flex-1">
                  <p className="font-display text-xs" style={{ color: WHITE }}>{t('checkout.card')}</p>
                  <p className="font-mono text-xs mt-1" style={{ color: GRAY_DARK }}>{t('checkout.cardDesc')}</p>
                </div>
              </label>
              <label
                className="flex items-center gap-3 p-4 cursor-pointer"
                style={{
                  border: payMethod === 'bizum' ? `2px solid ${BLUE}` : `1px solid ${BORDER}`,
                  backgroundColor: payMethod === 'bizum' ? BLUE_DIM : 'transparent',
                  minHeight: '44px',
                }}
              >
                <input
                  type="radio"
                  name="payMethod"
                  checked={payMethod === 'bizum'}
                  onChange={() => setPayMethod('bizum')}
                  className="accent-blue-500"
                />
                <div className="flex-1">
                  <p className="font-display text-xs" style={{ color: WHITE }}>{t('checkout.bizum')}</p>
                  <p className="font-mono text-xs mt-1" style={{ color: GRAY_DARK }}>{t('checkout.bizumDesc')}</p>
                </div>
              </label>
            </div>
          </div>

          {/* ── Total and pay button ─────────────────────────── */}
          <div className="p-4" style={{ border: `2px solid ${BLUE}` }}>
            <div className="flex justify-between mb-2">
              <span className="font-mono text-xs" style={{ color: GRAY }}>{t('checkout.subtotal')}</span>
              <span className="font-mono text-xs" style={{ color: WHITE }}>{totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-mono text-xs" style={{ color: GRAY }}>
                {t('checkout.shipping')} {isGUARDI ? `(${t('checkout.guardi')})` : ''}
              </span>
              <span className="font-mono text-xs" style={{ color: WHITE }}>
                {shippingCost === 0 ? t('checkout.free') : `${shippingCost.toFixed(2)} €`}
              </span>
            </div>
            <div className="flex justify-between mb-6 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span className="font-display text-base" style={{ color: WHITE }}>{t('checkout.total')}</span>
              <span className="font-display text-base" style={{ color: BLUE }}>{grandTotal.toFixed(2)} €</span>
            </div>

            {error && (
              <div className="mb-4 p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <p className="font-mono text-xs" style={{ color: '#EF4444' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full font-display text-sm uppercase py-4 min-h-[52px] transition-colors duration-200"
              style={{
                backgroundColor: loading ? '#1E3A5F' : BLUE,
                color: WHITE,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? t('checkout.processing') : payMethod === 'bizum' ? t('checkout.payBizum') : t('checkout.payCard')}
            </button>

            <p className="font-mono text-xs text-center mt-4" style={{ color: GRAY_DARK }}>
              {t('checkout.redsysRedirect')}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
