'use client'

import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalPrice, isOpen, toggleCart } = useCart() as any
  const { t } = useLocale()
  const router = useRouter()

  const drawerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const [translateX, setTranslateX] = useState(0)

  useEffect(() => { setTranslateX(0) }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => { startXRef.current = e.touches[0].clientX }
  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startXRef.current
    currentXRef.current = diff
    if (diff > 0) setTranslateX(diff)
  }
  const handleTouchEnd = () => {
    if (currentXRef.current > 100) toggleCart()
    setTranslateX(0)
    currentXRef.current = 0
  }

  function handleCheckout() {
    if (items.length === 0) return
    toggleCart()
    router.push('/checkout')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleCart} />
      <div
        ref={drawerRef}
        className="relative w-full h-full bg-white shadow-xl flex flex-col border-l-2 border-black text-black"
        style={{
          paddingRight: 'env(safe-area-inset-right, 0px)',
          transform: translateX > 0 ? `translateX(${translateX}px)` : undefined,
          transition: translateX > 0 ? 'none' : 'transform 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-black" style={{ backgroundColor: '#F0E040' }}>
          <h2 className="font-display uppercase text-xl" style={{ letterSpacing: '-0.05em', color: '#000000' }}>
            CARRITO ({items.length})
          </h2>
          <button onClick={toggleCart} className="font-display text-xs min-h-[44px] flex items-center" style={{ color: '#000000', cursor: 'pointer' }}>✕ CERRAR</button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            {items.length === 0 ? (
              <p className="font-mono text-xs text-center mt-20" style={{ color: '#000000' }}>{t('cart.empty')}</p>
            ) : (
              items.map((item: any) => (
                <div key={item.discogs_listing_id} className="flex gap-3 border-b border-gray-300 pb-3">
                  <div className="w-16 h-16 relative border border-black flex-shrink-0 bg-gray-100">
                    <Image src={item.cover_image || '/placeholder.png'} alt={item.title} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs uppercase truncate" style={{ letterSpacing: '-0.02em', color: '#000000' }}>
                      {item.artists[0]} — {item.title}
                    </p>
                    <p className="font-mono text-xs mt-1" style={{ color: '#000000' }}>{item.condition}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity?.(item.discogs_listing_id, Math.max(1, (item.quantity || 1) - 1))}
                        className="flex items-center justify-center text-xs"
                        style={{ width: '24px', height: '24px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: '#f9fafb', padding: '10px', minWidth: '44px', minHeight: '44px' }}>−</button>
                      <span className="font-mono text-xs w-6 text-center" style={{ color: '#000000' }}>{item.quantity || 1}</span>
                      <button onClick={() => {
                        const stockQty = (item as any).stock_quantity ?? (item as any).quantity ?? 999
                        const currentQty = item.quantity || 1
                        if (currentQty < stockQty) updateQuantity?.(item.discogs_listing_id, currentQty + 1)
                      }}
                        className="flex items-center justify-center text-xs"
                        style={{ width: '24px', height: '24px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: '#f9fafb', padding: '10px', minWidth: '44px', minHeight: '44px', opacity: (item.quantity || 1) >= ((item as any).stock_quantity ?? 999) ? 0.3 : 1 }}>+</button>
                      {((item as any).stock_quantity != null && (item as any).stock_quantity > 1) && (
                        <span className="font-mono text-[10px]" style={{ color: '#999' }}>/ {(item as any).stock_quantity} uds.</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-display text-sm" style={{ color: '#000000' }}>{(item.price * (item.quantity || 1)).toFixed(2)} €</span>
                      <button onClick={() => removeItem(item.discogs_listing_id)} className="font-display text-xs hover:underline min-h-[44px] flex items-center" style={{ color: '#000000', cursor: 'pointer' }}>{t('btn.remove')}</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t-2 border-black p-4 space-y-4 bg-white" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex justify-between font-display text-lg" style={{ color: '#000000' }}>
            <span>{t('cart.total')}</span>
            <span>{totalPrice.toFixed(2)} €</span>
          </div>
          <button
            className="w-full py-3 font-display text-sm uppercase bg-black text-white hover:bg-[#F0E040] hover:text-black transition-colors disabled:opacity-30 min-h-[44px]"
            style={{ cursor: 'pointer' }}
            disabled={items.length === 0}
            onClick={handleCheckout}>
            {t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  )
}
