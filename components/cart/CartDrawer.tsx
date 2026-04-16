'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import Image from 'next/image'
import type { ShippingRate } from '@/types'

export default function CartDrawer() {
  const { items, removeItem, totalPrice, isOpen, toggleCart, clearCart } = useCart()
  const { t } = useLocale()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<string>('')
  const [showShipping, setShowShipping] = useState(false)

  // Cargar tarifas de envío al querer hacer checkout
  async function loadShippingRates() {
    try {
      const res = await fetch('/api/shipping-rates')
      if (res.ok) {
        const data = await res.json()
        setShippingRates(data.rates || [])
        // Seleccionar Click & Collect por defecto si está disponible
        const clickCollect = data.rates?.find((r: ShippingRate) => r.method === 'click_collect')
        if (clickCollect) setSelectedRate(clickCollect.id)
        setShowShipping(true)
      }
    } catch {
      setCheckoutError(t('cart.shippingError'))
    }
  }

  async function handleCheckout() {
    if (items.length === 0) return

    if (!showShipping) {
      loadShippingRates()
      return
    }

    if (!selectedRate) {
      setCheckoutError(t('cart.selectShipping'))
      return
    }

    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      const res = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
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
        }),
      })

      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || t('cart.checkoutError'))
      }
    } catch {
      setCheckoutError(t('cart.connectionError'))
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedShippingRate = shippingRates.find(r => r.id === selectedRate)
  const shippingCost = selectedShippingRate?.price ?? 0
  const grandTotal = totalPrice + shippingCost

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black opacity-50" onClick={toggleCart} />
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col border-l-2 border-black text-black">

        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="font-display uppercase text-xl" style={{ letterSpacing: '-0.05em', color: '#000000' }}>
            {t('cart.title')} ({items.length})
          </h2>
          <button onClick={toggleCart} className="font-display text-xs" style={{ color: '#000000' }}>✕ {t('cart.close')}</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="font-mono text-xs text-center mt-20" style={{ color: '#000000' }}>{t('cart.empty')}</p>
          ) : (
            items.map(item => (
              <div key={item.discogs_listing_id} className="flex gap-3 border-b border-gray-300 pb-3">
                <div className="w-16 h-16 relative border border-black flex-shrink-0 bg-gray-100">
                  <Image src={item.cover_image || '/placeholder.png'} alt={item.title} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs uppercase truncate" style={{ letterSpacing: '-0.02em', color: '#000000' }}>
                    {item.artists[0]} — {item.title}
                  </p>
                  <p className="font-mono text-xs mt-1" style={{ color: '#000000' }}>{item.condition}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-display text-sm" style={{ color: '#000000' }}>{item.price.toFixed(2)} €</span>
                    <button onClick={() => removeItem(item.discogs_listing_id)} className="font-display text-xs hover:underline" style={{ color: '#000000' }}>{t('btn.remove')}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selección de envío */}
        {showShipping && items.length > 0 && (
          <div className="border-t border-gray-300 p-4">
            <p className="font-display text-xs mb-3" style={{ color: '#000' }}>{t('cart.shippingMethod')}</p>
            <div className="space-y-2">
              {shippingRates.map(rate => (
                <label key={rate.id}
                  className="flex items-center gap-3 p-2 cursor-pointer"
                  style={{
                    border: selectedRate === rate.id ? '2px solid #000' : '1px solid #ccc',
                    backgroundColor: selectedRate === rate.id ? '#f5f5f5' : 'transparent',
                  }}>
                  <input
                    type="radio"
                    name="shipping"
                    value={rate.id}
                    checked={selectedRate === rate.id}
                    onChange={() => setSelectedRate(rate.id)}
                    className="accent-black"
                  />
                  <div className="flex-1">
                    <p className="font-display text-xs" style={{ color: '#000' }}>{rate.name}</p>
                    {rate.description && (
                      <p className="font-meta text-xs" style={{ color: '#666' }}>{rate.description}</p>
                    )}
                  </div>
                  <span className="font-display text-xs" style={{ color: '#000' }}>
                    {rate.price === 0 ? t('cart.free') : `${rate.price.toFixed(2)} €`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="border-t-2 border-black p-4 space-y-4 bg-white">
          {showShipping && selectedShippingRate && (
            <div className="flex justify-between font-meta text-xs" style={{ color: '#666' }}>
              <span>{t('cart.shipping')} ({selectedShippingRate.name})</span>
              <span>{shippingCost === 0 ? t('cart.free') : `${shippingCost.toFixed(2)} €`}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-lg" style={{ color: '#000000' }}>
            <span>{t('cart.total')}</span>
            <span>{showShipping ? grandTotal.toFixed(2) : totalPrice.toFixed(2)} €</span>
          </div>
          {checkoutError && (
            <p className="font-meta text-xs" style={{ color: '#ef4444' }}>{checkoutError}</p>
          )}
          <button
            className="w-full py-3 font-display text-sm uppercase bg-black text-white hover:bg-[#F0E040] hover:text-black transition-colors disabled:opacity-30"
            disabled={items.length === 0 || checkoutLoading}
            onClick={handleCheckout}
          >
            {checkoutLoading ? t('cart.processing') : showShipping ? t('cart.pay') : t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  )
}
