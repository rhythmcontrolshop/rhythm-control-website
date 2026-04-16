'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import Image from 'next/image'
import type { ShippingRate } from '@/types'

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalPrice, isOpen, toggleCart, clearCart } = useCart() as any
  const { t } = useLocale()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<string>('')
  const [showShipping, setShowShipping] = useState(false)

  async function loadShippingRates() {
    try {
      const res = await fetch('/api/shipping-rates')
      if (res.ok) {
        const data = await res.json()
        setShippingRates(data.rates || [])
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
    if (!showShipping) { loadShippingRates(); return }
    if (!selectedRate) { setCheckoutError(t('cart.selectShipping')); return }

    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i: any) => ({
            id: i.id, discogs_listing_id: i.discogs_listing_id,
            title: i.title, artists: i.artists, condition: i.condition,
            format: i.format, labels: i.labels, cover_image: i.cover_image,
            price: i.price, quantity: i.quantity,
          })),
          shippingRateId: selectedRate, channel: 'online',
        }),
      })
      const data = await res.json()
      if (res.ok && data.url) { window.location.href = data.url }
      else { setCheckoutError(data.error || t('cart.checkoutError')) }
    } catch { setCheckoutError(t('cart.connectionError')) }
    finally { setCheckoutLoading(false) }
  }

  if (!isOpen) return null

  const selectedShippingRate = shippingRates.find(r => r.id === selectedRate)
  const shippingCost = selectedShippingRate?.price ?? 0
  const grandTotal = totalPrice + shippingCost

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black opacity-50" onClick={toggleCart} />
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col border-l-2 border-black text-black" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="font-display uppercase text-xl" style={{ letterSpacing: '-0.05em', color: '#000000' }}>
            CARRITO ({items.length})
          </h2>
          <button onClick={toggleCart} className="font-display text-xs" style={{ color: '#000000', cursor: 'pointer' }}>✕ CERRAR</button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            {items.length === 0 ? (
              <p className="font-mono text-xs text-center mt-20" style={{ color: '#000000' }}>{t('cart.empty')}</p>
            ) : (
              items.map((item: any) => (
                <div key={item.discogs_listing_id} className="flex gap-3 border-b border-gray-300 pb-3">
                  <div className="w-16 h-16 relative border border-black flex-shrink-0 bg-gray-100">
                    <Image src={item.cover_image || '/placeholder.png'} alt={item.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs uppercase truncate" style={{ letterSpacing: '-0.02em', color: '#000000' }}>
                      {item.artists[0]} — {item.title}
                    </p>
                    <p className="font-mono text-xs mt-1" style={{ color: '#000000' }}>{item.condition}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity?.(item.discogs_listing_id, Math.max(1, (item.quantity || 1) - 1))}
                        className="w-6 h-6 flex items-center justify-center text-xs"
                        style={{ border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: '#f9fafb' }}>−</button>
                      <span className="font-mono text-xs w-6 text-center" style={{ color: '#000000' }}>{item.quantity || 1}</span>
                      <button onClick={() => {
                        const stockQty = (item as any).stock_quantity ?? (item as any).quantity ?? 999
                        const currentQty = item.quantity || 1
                        if (currentQty < stockQty) {
                          updateQuantity?.(item.discogs_listing_id, currentQty + 1)
                        }
                      }}
                        className="w-6 h-6 flex items-center justify-center text-xs"
                        style={{ border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: '#f9fafb', opacity: (item.quantity || 1) >= ((item as any).stock_quantity ?? 999) ? 0.3 : 1 }}>+</button>
                      {((item as any).stock_quantity != null && (item as any).stock_quantity > 1) && (
                        <span className="font-mono text-[10px]" style={{ color: '#999' }}>/ {(item as any).stock_quantity} uds.</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="font-display text-sm" style={{ color: '#000000' }}>{(item.price * (item.quantity || 1)).toFixed(2)} €</span>
                      <button onClick={() => removeItem(item.discogs_listing_id)} className="font-display text-xs hover:underline" style={{ color: '#000000', cursor: 'pointer' }}>{t('btn.remove')}</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Shipping selection — inside scroll area so it never overflows the drawer */}
          {showShipping && items.length > 0 && (
            <div className="border-t border-gray-300 p-4">
              <p className="font-display text-xs mb-3" style={{ color: '#000' }}>{t('cart.shippingMethod')}</p>
              <div className="space-y-2">
                {shippingRates.map(rate => (
                  <label key={rate.id}
                    className="flex items-center gap-3 p-2"
                    style={{
                      border: selectedRate === rate.id ? '2px solid #000' : '1px solid #ccc',
                      backgroundColor: selectedRate === rate.id ? '#f5f5f5' : 'transparent',
                      cursor: 'pointer',
                    }}>
                    <input type="radio" name="shipping" value={rate.id} checked={selectedRate === rate.id}
                      onChange={() => setSelectedRate(rate.id)} className="accent-black" />
                    <div className="flex-1">
                      <p className="font-display text-xs" style={{ color: '#000' }}>{rate.name}</p>
                      {rate.description && <p className="font-meta text-xs" style={{ color: '#666' }}>{rate.description}</p>}
                    </div>
                    <span className="font-display text-xs" style={{ color: '#000' }}>
                      {rate.price === 0 ? t('cart.free') : `${rate.price.toFixed(2)} €`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

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
          {checkoutError && <p className="font-meta text-xs" style={{ color: '#ef4444' }}>{checkoutError}</p>}
          <button
            className="w-full py-3 font-display text-sm uppercase bg-black text-white hover:bg-[#F0E040] hover:text-black transition-colors disabled:opacity-30"
            style={{ cursor: 'pointer' }}
            disabled={items.length === 0 || checkoutLoading}
            onClick={handleCheckout}>
            {checkoutLoading ? t('cart.processing') : showShipping ? t('cart.pay') : t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  )
}
