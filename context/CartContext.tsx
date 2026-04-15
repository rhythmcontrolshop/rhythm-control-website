'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Release } from '@/types'

export interface CartItem extends Release {
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (release: Release) => void
  removeItem: (listingId: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isOpen: boolean
  toggleCart: () => void
  openCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Cargar del localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('rhythm_cart')
    if (saved) setItems(JSON.parse(saved))
    setIsHydrated(true)
  }, [])

  // Guardar en localStorage al cambiar
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('rhythm_cart', JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (release: Release) => {
    setItems(prev => {
      const exists = prev.find(i => i.discogs_listing_id === release.discogs_listing_id)
      if (exists) return prev // No duplicar
      return [...prev, { ...release, quantity: 1 }]
    })
    setIsOpen(true) // Abrir drawer al añadir
  }

  const removeItem = (listingId: number) => {
    setItems(prev => prev.filter(i => i.discogs_listing_id !== listingId))
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0)

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, clearCart,
      totalItems, totalPrice, isOpen,
      toggleCart: () => setIsOpen(!isOpen),
      openCart: () => setIsOpen(true)
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
