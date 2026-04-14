'use client'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'

export default function CartDrawer() {
  const { items, removeItem, totalPrice, isOpen, toggleCart } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black opacity-50" onClick={toggleCart} />
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col border-l-2 border-black text-black">
        
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="font-display uppercase text-xl" style={{ letterSpacing: '-0.05em', color: '#000000' }}>
            CARRITO ({items.length})
          </h2>
          <button onClick={toggleCart} className="font-display text-xs" style={{ color: '#000000' }}>✕ CERRAR</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="font-mono text-xs text-center mt-20" style={{ color: '#000000' }}>TU CARRITO ESTÁ VACÍO</p>
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
                    <button onClick={() => removeItem(item.discogs_listing_id)} className="font-display text-xs hover:underline" style={{ color: '#000000' }}>ELIMINAR</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t-2 border-black p-4 space-y-4 bg-white">
          <div className="flex justify-between font-display text-lg" style={{ color: '#000000' }}>
            <span>TOTAL</span>
            <span>{totalPrice.toFixed(2)} €</span>
          </div>
          <button 
            className="w-full py-3 font-display text-sm uppercase bg-black text-white hover:bg-[#F0E040] hover:text-black transition-colors disabled:opacity-30"
            disabled={items.length === 0}
          >
            CHECKOUT (PRÓXIMAMENTE)
          </button>
        </div>
      </div>
    </div>
  )
}
