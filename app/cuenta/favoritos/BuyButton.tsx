'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import type { Release } from '@/types'

export default function BuyButton({ release }: { release: any }) {
  const { addItem, openCart } = useCart()
  const [added, setAdded] = useState(false)

  function handleBuy() {
    const item: Partial<Release> & { quantity: number } = {
      id: release.id,
      title: release.title,
      artists: release.artists ?? [],
      price: release.price ?? 0,
      cover_image: release.cover_image ?? '',
      condition: release.condition ?? '',
      format: release.format ?? '',
      labels: release.labels ?? [],
      discogs_listing_id: release.discogs_listing_id ?? 0,
      quantity: 1,
    }
    addItem(item as any)
    openCart()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button onClick={handleBuy}
      className="font-display text-xs px-4 py-2 transition-opacity hover:opacity-80"
      style={{ backgroundColor: '#F0E040', color: '#000000', cursor: 'pointer' }}>
      {added ? 'AÑADIDO ✓' : 'COMPRAR'}
    </button>
  )
}
