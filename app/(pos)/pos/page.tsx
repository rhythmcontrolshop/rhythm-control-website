'use client'

// app/(pos)/pos/page.tsx
// Interfaz principal del POS — búsqueda, ticket, cobro

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

// ─── Types ──────────────────────────────────────────────────────────────────

interface POSItem {
  id: string
  discogs_listing_id: number
  title: string
  artists: string[]
  condition: string
  format: string
  price_base: number
  price_channel: number  // precio physical (×0.95)
  cover_image: string
  barcode: string | null
  quantity: number       // stock disponible
  ticketQty: number      // unidades en el ticket
}

interface SearchResult {
  id: string
  title: string
  artists: string[]
  condition: string
  format: string
  price: number
  cover_image: string
  barcode: string | null
  quantity: number
}

type PaymentMethod = 'cash' | 'card' | 'bizum'

export default function POSPage() {
  // ── State ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [ticket, setTicket] = useState<POSItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [cashReceived, setCashReceived] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [lastSaleNumber, setLastSaleNumber] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [discount, setDiscount] = useState(0) // percentage

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // ── Search ────────────────────────────────────────────────────────
  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/inventory?search=${encodeURIComponent(query)}&status=active&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.releases ?? [])
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, doSearch])

  // ── Ticket management ─────────────────────────────────────────────
  function addToTicket(item: SearchResult) {
    setTicket(prev => {
      const existing = prev.find(t => t.id === item.id)
      if (existing) {
        // Incrementar cantidad si hay stock
        if (existing.ticketQty < item.quantity) {
          return prev.map(t =>
            t.id === item.id ? { ...t, ticketQty: t.ticketQty + 1 } : t
          )
        }
        return prev
      }
      // Añadir nuevo item con precio physical
      const physicalCoefficient = 0.95 // Se obtendrá de price_channels, simplificado aquí
      return [...prev, {
        id: item.id,
        discogs_listing_id: 0,
        title: item.title,
        artists: item.artists,
        condition: item.condition ?? '',
        format: item.format ?? '',
        price_base: item.price,
        price_channel: Math.round(item.price * physicalCoefficient * 100) / 100,
        cover_image: item.cover_image,
        barcode: item.barcode,
        quantity: item.quantity,
        ticketQty: 1,
      }]
    })
    setSearchQuery('')
    setSearchResults([])
    searchInputRef.current?.focus()
  }

  function removeFromTicket(id: string) {
    setTicket(prev => prev.filter(t => t.id !== id))
  }

  function updateTicketQty(id: string, qty: number) {
    if (qty < 1) {
      removeFromTicket(id)
      return
    }
    setTicket(prev => prev.map(t =>
      t.id === id ? { ...t, ticketQty: Math.min(qty, t.quantity) } : t
    ))
  }

  // ── Calculations ──────────────────────────────────────────────────
  const subtotal = ticket.reduce((sum, t) => sum + (t.price_channel * t.ticketQty), 0)
  const discountAmount = subtotal * (discount / 100)
  const totalAfterDiscount = subtotal - discountAmount
  const taxRate = 0.04 // 4% IVA superreducido
  const taxAmount = Math.round(totalAfterDiscount * taxRate / (1 + taxRate) * 100) / 100
  const total = totalAfterDiscount

  const cashReceivedNum = parseFloat(cashReceived) || 0
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, cashReceivedNum - total) : 0

  // ── Checkout ──────────────────────────────────────────────────────
  async function handleCheckout() {
    if (ticket.length === 0) return
    if (paymentMethod === 'cash' && cashReceivedNum < total) {
      setError('El efectivo recibido es insuficiente')
      return
    }

    setCheckoutLoading(true)
    setError('')

    try {
      const res = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: ticket.map(t => ({
            release_id: t.id,
            title: t.title,
            artists: t.artists,
            condition: t.condition,
            price_base: t.price_base,
            price_channel: t.price_channel,
            quantity: t.ticketQty,
          })),
          payment_method: paymentMethod,
          discount_percentage: discount,
          cash_received: paymentMethod === 'cash' ? cashReceivedNum : null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setLastSaleNumber(data.sale_number)
        setTicket([])
        setCashReceived('')
        setDiscount(0)
        setShowCheckout(false)
      } else {
        setError(data.error || 'Error al procesar la venta')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'F9' && ticket.length > 0) {
        e.preventDefault()
        setShowCheckout(true)
      }
      if (e.key === 'Escape') {
        setShowCheckout(false)
        setLastSaleNumber(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [ticket.length])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left panel: Search ──────────────────────────────────────── */}
      <div className="w-[45%] flex flex-col border-r" style={{ borderColor: '#333' }}>
        {/* Search bar */}
        <div className="p-3 border-b" style={{ borderColor: '#333' }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs" style={{ color: '#666' }}>F2</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar disco, artista, barcode..."
              className="flex-1 bg-transparent font-mono text-sm focus:outline-none"
              style={{ border: '1px solid #333', color: '#FFF', padding: '10px' }}
            />
          </div>
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {searching && (
            <p className="font-mono text-xs" style={{ color: '#666' }}>Buscando...</p>
          )}
          {searchResults.map((item) => (
            <button
              key={item.id}
              onClick={() => addToTicket(item)}
              className="w-full flex items-center gap-3 p-3 text-left transition-colors"
              style={{ border: '1px solid #222', backgroundColor: '#111', cursor: 'pointer', minHeight: '60px' }}
            >
              <div className="w-12 h-12 relative flex-shrink-0 bg-gray-800">
                <Image
                  src={item.cover_image || '/placeholder.png'}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs uppercase truncate" style={{ color: '#FFF' }}>
                  {item.artists?.[0]} — {item.title}
                </p>
                <p className="font-mono text-xs" style={{ color: '#666' }}>
                  {item.condition} {item.format ? `· ${item.format}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display text-sm" style={{ color: '#F0E040' }}>
                  {item.price.toFixed(2)} €
                </p>
                <p className="font-mono text-xs" style={{ color: '#666' }}>
                  Stock: {item.quantity}
                </p>
              </div>
            </button>
          ))}
          {!searching && searchQuery && searchResults.length === 0 && (
            <p className="font-mono text-xs text-center mt-8" style={{ color: '#666' }}>
              Sin resultados para &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      </div>

      {/* ── Right panel: Ticket ──────────────────────────────────────── */}
      <div className="w-[55%] flex flex-col" style={{ backgroundColor: '#0d0d0d' }}>
        {/* Ticket header */}
        <div className="p-3 border-b" style={{ borderColor: '#333', backgroundColor: '#111' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs uppercase" style={{ color: '#FFF', letterSpacing: '0.1em' }}>
              TICKET
            </h2>
            <span className="font-mono text-xs" style={{ color: '#666' }}>
              {ticket.length} {ticket.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Ticket items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {ticket.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="font-mono text-xs" style={{ color: '#333' }}>
                Escanea o busca discos para añadir al ticket
              </p>
            </div>
          ) : (
            ticket.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2" style={{ borderBottom: '1px solid #1a1a1a' }}>
                <div className="w-10 h-10 relative flex-shrink-0 bg-gray-800">
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
                  <p className="font-mono text-xs" style={{ color: '#666' }}>
                    {item.price_channel.toFixed(2)} € / ud.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateTicketQty(item.id, item.ticketQty - 1)}
                    className="w-8 h-8 flex items-center justify-center font-mono text-sm"
                    style={{ border: '1px solid #333', color: '#FFF', cursor: 'pointer' }}
                  >−</button>
                  <span className="font-mono text-sm w-6 text-center" style={{ color: '#FFF' }}>
                    {item.ticketQty}
                  </span>
                  <button
                    onClick={() => updateTicketQty(item.id, item.ticketQty + 1)}
                    className="w-8 h-8 flex items-center justify-center font-mono text-sm"
                    style={{ border: '1px solid #333', color: '#FFF', cursor: 'pointer', opacity: item.ticketQty >= item.quantity ? 0.3 : 1 }}
                  >+</button>
                </div>
                <div className="text-right flex-shrink-0 w-20">
                  <p className="font-display text-sm" style={{ color: '#F0E040' }}>
                    {(item.price_channel * item.ticketQty).toFixed(2)} €
                  </p>
                </div>
                <button
                  onClick={() => removeFromTicket(item.id)}
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{ color: '#ef4444', cursor: 'pointer' }}
                >✕</button>
              </div>
            ))
          )}
        </div>

        {/* Discount */}
        {ticket.length > 0 && (
          <div className="px-3 py-2 border-t" style={{ borderColor: '#222' }}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs" style={{ color: '#666' }}>Descuento %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discount || ''}
                onChange={e => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-16 bg-transparent font-mono text-sm text-center focus:outline-none"
                style={{ border: '1px solid #333', color: '#FFF', padding: '4px' }}
              />
            </div>
          </div>
        )}

        {/* Totals and checkout button */}
        <div className="p-3 border-t" style={{ borderColor: '#333', backgroundColor: '#111' }}>
          {discount > 0 && (
            <div className="flex justify-between mb-1">
              <span className="font-mono text-xs" style={{ color: '#999' }}>Descuento ({discount}%)</span>
              <span className="font-mono text-xs" style={{ color: '#ef4444' }}>-{discountAmount.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between mb-1">
            <span className="font-mono text-xs" style={{ color: '#999' }}>IVA incluido (4%)</span>
            <span className="font-mono text-xs" style={{ color: '#999' }}>{taxAmount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="font-display text-lg" style={{ color: '#FFF' }}>TOTAL</span>
            <span className="font-display text-lg" style={{ color: '#F0E040' }}>{total.toFixed(2)} €</span>
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            disabled={ticket.length === 0}
            className="w-full py-4 font-display text-sm uppercase min-h-[56px] transition-colors"
            style={{
              backgroundColor: ticket.length === 0 ? '#333' : '#F0E040',
              color: ticket.length === 0 ? '#666' : '#000',
              cursor: ticket.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            COBRAR (F9)
          </button>
        </div>
      </div>

      {/* ── Checkout modal ────────────────────────────────────────────── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <div className="w-full max-w-md p-6" style={{ backgroundColor: '#0a0a0a', border: '2px solid #F0E040' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg" style={{ color: '#F0E040' }}>COBRO</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="font-display text-sm min-h-[44px] flex items-center"
                style={{ color: '#999', cursor: 'pointer' }}
              >✕ ESC</button>
            </div>

            <div className="text-center mb-6">
              <p className="font-mono text-xs mb-1" style={{ color: '#999' }}>TOTAL A COBRAR</p>
              <p className="font-display text-4xl" style={{ color: '#F0E040' }}>{total.toFixed(2)} €</p>
            </div>

            {/* Payment method selection */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {(['card', 'cash', 'bizum'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className="py-3 font-display text-xs uppercase min-h-[52px] transition-colors"
                  style={{
                    border: paymentMethod === method ? '2px solid #F0E040' : '1px solid #333',
                    backgroundColor: paymentMethod === method ? 'rgba(240, 224, 64, 0.1)' : 'transparent',
                    color: paymentMethod === method ? '#F0E040' : '#999',
                    cursor: 'pointer',
                  }}
                >
                  {method === 'card' ? 'TARJETA' : method === 'cash' ? 'EFECTIVO' : 'BIZUM'}
                </button>
              ))}
            </div>

            {/* Cash-specific fields */}
            {paymentMethod === 'cash' && (
              <div className="mb-6">
                <label className="font-mono text-xs block mb-2" style={{ color: '#999' }}>
                  Efectivo recibido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  className="w-full bg-transparent font-display text-2xl text-center focus:outline-none"
                  style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                  placeholder="0.00"
                  autoFocus
                />
                {cashReceivedNum >= total && (
                  <div className="mt-3 p-3 text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e' }}>
                    <p className="font-mono text-xs" style={{ color: '#999' }}>CAMBIO</p>
                    <p className="font-display text-2xl" style={{ color: '#22c55e' }}>{changeAmount.toFixed(2)} €</p>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'card' && (
              <p className="font-mono text-xs text-center mb-6" style={{ color: '#666' }}>
                Cobra con el datáfono y confirma la venta
              </p>
            )}

            {paymentMethod === 'bizum' && (
              <p className="font-mono text-xs text-center mb-6" style={{ color: '#666' }}>
                El cliente paga vía Bizum. Confirma cuando recibas el pago.
              </p>
            )}

            {error && (
              <p className="font-mono text-xs mb-3" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || (paymentMethod === 'cash' && cashReceivedNum < total)}
              className="w-full py-4 font-display text-sm uppercase min-h-[56px] transition-colors"
              style={{
                backgroundColor: checkoutLoading ? '#666' : '#F0E040',
                color: '#000',
                cursor: checkoutLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {checkoutLoading ? 'PROCESANDO...' : paymentMethod === 'cash' ? `CONFIRMAR — CAMBIO: ${changeAmount.toFixed(2)} €` : 'CONFIRMAR VENTA'}
            </button>
          </div>
        </div>
      )}

      {/* ── Last sale confirmation ────────────────────────────────────── */}
      {lastSaleNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <div className="w-full max-w-sm p-6 text-center" style={{ backgroundColor: '#0a0a0a', border: '2px solid #22c55e' }}>
            <p className="font-display text-lg mb-2" style={{ color: '#22c55e' }}>VENTA COMPLETADA</p>
            <p className="font-mono text-sm mb-4" style={{ color: '#FFF' }}>
              {lastSaleNumber}
            </p>
            <button
              onClick={() => setLastSaleNumber(null)}
              className="w-full py-3 font-display text-sm min-h-[44px]"
              style={{ backgroundColor: '#FFF', color: '#000', cursor: 'pointer' }}
            >
              CONTINUAR (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
