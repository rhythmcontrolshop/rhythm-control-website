'use client'

// app/(pos)/pos/page.tsx
// Interfaz principal del POS — WHITE THEME with mockup data for demo
// Búsqueda client-side, ticket builder, cobro simulado

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Mockup Data ────────────────────────────────────────────────────────────

interface MockupRecord {
  id: string
  artist: string
  title: string
  condition: string
  format: string
  price: number
  stock: number
  initials: string
  color: string
}

const MOCKUP_RECORDS: MockupRecord[] = [
  {
    id: 'mock-001',
    artist: 'Aphex Twin',
    title: 'Selected Ambient Works 85-92',
    condition: 'NM',
    format: 'LP',
    price: 28.00,
    stock: 2,
    initials: 'AT',
    color: '#E8D5B7',
  },
  {
    id: 'mock-002',
    artist: 'Boards of Canada',
    title: 'Music Has The Right To Children',
    condition: 'NM',
    format: 'LP',
    price: 32.00,
    stock: 1,
    initials: 'BOC',
    color: '#B7D5E8',
  },
  {
    id: 'mock-003',
    artist: 'Burial',
    title: 'Untrue',
    condition: 'VG+',
    format: 'LP',
    price: 45.00,
    stock: 1,
    initials: 'BU',
    color: '#1a1a2e',
  },
  {
    id: 'mock-004',
    artist: 'DJ Shadow',
    title: 'Endtroducing.....',
    condition: 'NM',
    format: '2xLP',
    price: 26.00,
    stock: 3,
    initials: 'DJS',
    color: '#D4C5A9',
  },
  {
    id: 'mock-005',
    artist: 'Massive Attack',
    title: 'Blue Lines',
    condition: 'NM',
    format: 'LP',
    price: 24.00,
    stock: 2,
    initials: 'MA',
    color: '#5B7DB1',
  },
  {
    id: 'mock-006',
    artist: 'Portishead',
    title: 'Dummy',
    condition: 'VG+',
    format: 'LP',
    price: 30.00,
    stock: 1,
    initials: 'PT',
    color: '#8B8BAE',
  },
  {
    id: 'mock-007',
    artist: 'Kraftwerk',
    title: 'Trans-Europe Express',
    condition: 'NM',
    format: 'LP',
    price: 22.00,
    stock: 2,
    initials: 'KW',
    color: '#C4C4C4',
  },
  {
    id: 'mock-008',
    artist: 'Daft Punk',
    title: 'Discovery',
    condition: 'NM',
    format: '2xLP',
    price: 35.00,
    stock: 1,
    initials: 'DP',
    color: '#D4AF37',
  },
  {
    id: 'mock-009',
    artist: 'Autechre',
    title: 'Tri Repetae',
    condition: 'VG',
    format: '2xLP',
    price: 38.00,
    stock: 1,
    initials: 'AE',
    color: '#4A4A4A',
  },
  {
    id: 'mock-010',
    artist: 'Four Tet',
    title: 'Rounds',
    condition: 'NM',
    format: 'LP',
    price: 20.00,
    stock: 3,
    initials: 'FT',
    color: '#A8D5BA',
  },
]

// ─── Ticket Item ────────────────────────────────────────────────────────────

interface TicketItem {
  id: string
  artist: string
  title: string
  condition: string
  format: string
  price: number // precio physical (×0.95)
  priceBase: number
  stock: number
  qty: number
  initials: string
  color: string
}

type PaymentMethod = 'card' | 'cash' | 'bizum'

// ─── Component ──────────────────────────────────────────────────────────────

export default function POSPage() {
  // ── State ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredResults, setFilteredResults] = useState<MockupRecord[]>(MOCKUP_RECORDS)
  const [ticket, setTicket] = useState<TicketItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [cashReceived, setCashReceived] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successSaleId, setSuccessSaleId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [error, setError] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // ── Client-side search ─────────────────────────────────────────
  const filterRecords = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredResults(MOCKUP_RECORDS)
      return
    }
    const q = query.toLowerCase().trim()
    const filtered = MOCKUP_RECORDS.filter(
      (r) =>
        r.artist.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.format.toLowerCase().includes(q) ||
        r.condition.toLowerCase().includes(q)
    )
    setFilteredResults(filtered)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => filterRecords(searchQuery), 150)
    return () => clearTimeout(timer)
  }, [searchQuery, filterRecords])

  // ── Ticket management ─────────────────────────────────────────────
  function addToTicket(record: MockupRecord) {
    setTicket((prev) => {
      const existing = prev.find((t) => t.id === record.id)
      if (existing) {
        if (existing.qty < record.stock) {
          return prev.map((t) =>
            t.id === record.id ? { ...t, qty: t.qty + 1 } : t
          )
        }
        return prev
      }
      const physicalCoefficient = 0.95
      return [
        ...prev,
        {
          id: record.id,
          artist: record.artist,
          title: record.title,
          condition: record.condition,
          format: record.format,
          price: Math.round(record.price * physicalCoefficient * 100) / 100,
          priceBase: record.price,
          stock: record.stock,
          qty: 1,
          initials: record.initials,
          color: record.color,
        },
      ]
    })
    // Don't clear search — user might want to add multiple items
    searchInputRef.current?.focus()
  }

  function removeFromTicket(id: string) {
    setTicket((prev) => prev.filter((t) => t.id !== id))
  }

  function updateTicketQty(id: string, qty: number) {
    if (qty < 1) {
      removeFromTicket(id)
      return
    }
    setTicket((prev) =>
      prev.map((t) => (t.id === id ? { ...t, qty: Math.min(qty, t.stock) } : t))
    )
  }

  // ── Calculations ──────────────────────────────────────────────────
  const subtotal = ticket.reduce((sum, t) => sum + t.price * t.qty, 0)
  const discountAmount = subtotal * (discount / 100)
  const totalAfterDiscount = subtotal - discountAmount
  const taxRate = 0.04 // 4% IVA superreducido
  const taxAmount = Math.round((totalAfterDiscount * taxRate) / (1 + taxRate) * 100) / 100
  const total = totalAfterDiscount

  const cashReceivedNum = parseFloat(cashReceived) || 0
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, cashReceivedNum - total) : 0

  // ── Simulated checkout ────────────────────────────────────────────
  async function handleCheckout() {
    if (ticket.length === 0) return
    if (paymentMethod === 'cash' && cashReceivedNum < total) {
      setError('El efectivo recibido es insuficiente')
      return
    }

    setCheckoutLoading(true)
    setError('')

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const saleId = `RC-${Date.now().toString(36).toUpperCase().slice(-6)}`
    setSuccessSaleId(saleId)
    setShowCheckout(false)
    setShowSuccess(true)
    setTicket([])
    setCashReceived('')
    setDiscount(0)
    setCheckoutLoading(false)
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
      if (e.key === 'F9' && ticket.length > 0 && !showCheckout) {
        e.preventDefault()
        setShowCheckout(true)
      }
      if (e.key === 'Escape') {
        if (showSuccess) {
          setShowSuccess(false)
        } else {
          setShowCheckout(false)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [ticket.length, showCheckout, showSuccess])

  // ── Check if item is in ticket ─────────────────────────────────
  function isInTicket(id: string) {
    return ticket.some((t) => t.id === id)
  }

  function getTicketQty(id: string) {
    return ticket.find((t) => t.id === id)?.qty ?? 0
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left panel: Search (45%) ─────────────────────────────── */}
      <div
        className="w-[45%] flex flex-col"
        style={{ borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
      >
        {/* Search bar */}
        <div className="p-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
              style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}
            >
              F2
            </span>
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar disco, artista..."
                className="w-full font-mono text-sm focus:outline-none"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#000000',
                  padding: '11px 14px',
                  backgroundColor: '#F9FAFB',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center"
                  style={{ color: '#9CA3AF', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <p className="font-mono text-[10px] mt-2" style={{ color: '#9CA3AF' }}>
            {filteredResults.length} disco{filteredResults.length !== 1 ? 's' : ''} en catálogo
          </p>
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredResults.map((record) => {
            const inTicket = isInTicket(record.id)
            const ticketQty = getTicketQty(record.id)

            return (
              <button
                key={record.id}
                onClick={() => addToTicket(record)}
                className="w-full flex items-center gap-3 p-3 text-left transition-all min-h-[64px]"
                style={{
                  border: inTicket ? '2px solid #F0E040' : '1px solid #E5E7EB',
                  backgroundColor: inTicket ? '#FEFCE8' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {/* Placeholder cover */}
                <div
                  className="w-11 h-11 flex-shrink-0 flex items-center justify-center font-display text-[10px]"
                  style={{ backgroundColor: record.color, color: '#FFFFFF' }}
                >
                  {record.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-display text-[11px] truncate"
                    style={{ color: '#000000', letterSpacing: '0.02em' }}
                  >
                    {record.artist} — {record.title}
                  </p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: '#6B7280' }}>
                    {record.condition} · {record.format} · Stock: {record.stock}
                  </p>
                </div>

                {/* Price + ticket indicator */}
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="font-mono text-sm font-bold" style={{ color: '#000000' }}>
                    {record.price.toFixed(2)} €
                  </p>
                  {inTicket && (
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5"
                      style={{ backgroundColor: '#F0E040', color: '#000000' }}
                    >
                      ×{ticketQty} en ticket
                    </span>
                  )}
                </div>
              </button>
            )
          })}

          {searchQuery && filteredResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="font-mono text-sm" style={{ color: '#6B7280' }}>
                Sin resultados para &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="font-mono text-xs mt-2 px-3 py-1.5 min-h-[44px] flex items-center"
                style={{ color: '#000000', borderBottom: '1px solid #000000', cursor: 'pointer' }}
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: Ticket (55%) ─────────────────────────────── */}
      <div
        className="w-[55%] flex flex-col"
        style={{ backgroundColor: '#F9FAFB' }}
      >
        {/* Ticket header */}
        <div
          className="px-5 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
        >
          <div className="flex items-center gap-2">
            <h2
              className="font-display text-xs"
              style={{ color: '#000000', letterSpacing: '0.08em' }}
            >
              TICKET
            </h2>
            {ticket.length > 0 && (
              <span
                className="font-mono text-[10px] px-1.5 py-0.5"
                style={{ backgroundColor: '#F0E040', color: '#000000' }}
              >
                {ticket.reduce((sum, t) => sum + t.qty, 0)} ud{ticket.reduce((sum, t) => sum + t.qty, 0) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {ticket.length > 0 && (
            <button
              onClick={() => setTicket([])}
              className="font-mono text-[10px] min-h-[44px] flex items-center px-2 transition-colors"
              style={{ color: '#9CA3AF', cursor: 'pointer' }}
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Ticket items */}
        <div className="flex-1 overflow-y-auto">
          {ticket.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8">
              <div
                className="w-16 h-16 flex items-center justify-center mb-4"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <span style={{ color: '#9CA3AF', fontSize: '24px' }}>♪</span>
              </div>
              <p className="font-mono text-xs text-center" style={{ color: '#9CA3AF' }}>
                Busca o haz clic en un disco para añadirlo al ticket
              </p>
              <p className="font-mono text-[10px] mt-1" style={{ color: '#D1D5DB' }}>
                F2 para buscar · F9 para cobrar
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {ticket.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                >
                  {/* Placeholder */}
                  <div
                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center font-display text-[9px]"
                    style={{ backgroundColor: item.color, color: '#FFFFFF' }}
                  >
                    {item.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-display text-[10px] truncate"
                      style={{ color: '#000000', letterSpacing: '0.02em' }}
                    >
                      {item.artist} — {item.title}
                    </p>
                    <p className="font-mono text-[10px]" style={{ color: '#6B7280' }}>
                      {item.price.toFixed(2)} €/ud · {item.condition} · {item.format}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => updateTicketQty(item.id, item.qty - 1)}
                      className="w-9 h-9 flex items-center justify-center font-mono text-sm transition-colors"
                      style={{
                        border: '1px solid #E5E7EB',
                        color: '#000000',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        minHeight: '44px',
                        minWidth: '44px',
                      }}
                    >
                      −
                    </button>
                    <span
                      className="font-mono text-sm w-8 text-center"
                      style={{ color: '#000000' }}
                    >
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateTicketQty(item.id, item.qty + 1)}
                      className="w-9 h-9 flex items-center justify-center font-mono text-sm transition-colors"
                      style={{
                        border: '1px solid #E5E7EB',
                        color: item.qty >= item.stock ? '#D1D5DB' : '#000000',
                        backgroundColor: '#FFFFFF',
                        cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer',
                        opacity: item.qty >= item.stock ? 0.4 : 1,
                        minHeight: '44px',
                        minWidth: '44px',
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right flex-shrink-0 w-20">
                    <p className="font-mono text-sm font-bold" style={{ color: '#000000' }}>
                      {(item.price * item.qty).toFixed(2)} €
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromTicket(item.id)}
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      color: '#EF4444',
                      cursor: 'pointer',
                      minHeight: '44px',
                      minWidth: '44px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discount row */}
        {ticket.length > 0 && (
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
          >
            <span className="font-mono text-xs" style={{ color: '#6B7280' }}>
              Descuento %
            </span>
            <div className="flex items-center gap-2">
              {[0, 5, 10, 15, 20].map((d) => (
                <button
                  key={d}
                  onClick={() => setDiscount(d)}
                  className="font-mono text-[11px] px-2.5 py-1 min-h-[36px] flex items-center transition-colors"
                  style={{
                    border: discount === d ? '2px solid #F0E040' : '1px solid #E5E7EB',
                    backgroundColor: discount === d ? '#FEFCE8' : '#FFFFFF',
                    color: discount === d ? '#000000' : '#6B7280',
                    cursor: 'pointer',
                  }}
                >
                  {d}%
                </button>
              ))}
              <input
                type="number"
                min="0"
                max="100"
                value={discount || ''}
                onChange={(e) =>
                  setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className="font-mono text-xs text-center focus:outline-none"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#000000',
                  padding: '6px 8px',
                  width: '52px',
                  backgroundColor: '#F9FAFB',
                }}
                placeholder="%"
              />
            </div>
          </div>
        )}

        {/* Totals + COBRAR */}
        <div
          className="px-5 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
        >
          {discount > 0 && (
            <div className="flex justify-between mb-1.5">
              <span className="font-mono text-xs" style={{ color: '#6B7280' }}>
                Subtotal
              </span>
              <span className="font-mono text-xs" style={{ color: '#6B7280' }}>
                {subtotal.toFixed(2)} €
              </span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between mb-1.5">
              <span className="font-mono text-xs" style={{ color: '#6B7280' }}>
                Descuento ({discount}%)
              </span>
              <span className="font-mono text-xs" style={{ color: '#EF4444' }}>
                −{discountAmount.toFixed(2)} €
              </span>
            </div>
          )}
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[10px]" style={{ color: '#9CA3AF' }}>
              IVA incluido (4%)
            </span>
            <span className="font-mono text-[10px]" style={{ color: '#9CA3AF' }}>
              {taxAmount.toFixed(2)} €
            </span>
          </div>
          <div
            className="flex justify-between items-baseline mt-3 mb-4 pt-3"
            style={{ borderTop: '1px solid #E5E7EB' }}
          >
            <span className="font-display text-lg" style={{ color: '#000000' }}>
              TOTAL
            </span>
            <span className="font-display text-2xl" style={{ color: '#000000' }}>
              {total.toFixed(2)} €
            </span>
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            disabled={ticket.length === 0}
            className="w-full py-4 font-display text-sm transition-all min-h-[56px]"
            style={{
              backgroundColor: ticket.length === 0 ? '#E5E7EB' : '#F0E040',
              color: ticket.length === 0 ? '#9CA3AF' : '#000000',
              cursor: ticket.length === 0 ? 'not-allowed' : 'pointer',
              letterSpacing: '0.08em',
            }}
          >
            COBRAR · F9
          </button>
        </div>
      </div>

      {/* ── Checkout modal ────────────────────────────────────────── */}
      {showCheckout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="w-full max-w-md"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #E5E7EB' }}
            >
              <h2
                className="font-display text-sm"
                style={{ color: '#000000', letterSpacing: '0.08em' }}
              >
                COBRO
              </h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="font-mono text-xs min-h-[44px] flex items-center gap-1 px-2"
                style={{ color: '#6B7280', cursor: 'pointer' }}
              >
                ✕ <span style={{ color: '#9CA3AF' }}>ESC</span>
              </button>
            </div>

            <div className="px-6 py-6">
              {/* Total */}
              <div className="text-center mb-6">
                <p className="font-mono text-[10px] mb-1" style={{ color: '#9CA3AF' }}>
                  TOTAL A COBRAR
                </p>
                <p
                  className="font-display text-4xl"
                  style={{ color: '#000000' }}
                >
                  {total.toFixed(2)} €
                </p>
              </div>

              {/* Payment method selection */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {(['card', 'cash', 'bizum'] as PaymentMethod[]).map((method) => {
                  const labels: Record<PaymentMethod, string> = {
                    card: 'TARJETA',
                    cash: 'EFECTIVO',
                    bizum: 'BIZUM',
                  }
                  const icons: Record<PaymentMethod, string> = {
                    card: '💳',
                    cash: '💶',
                    bizum: '📱',
                  }
                  return (
                    <button
                      key={method}
                      onClick={() => {
                        setPaymentMethod(method)
                        setError('')
                      }}
                      className="py-3 font-display text-[10px] min-h-[52px] transition-all flex flex-col items-center gap-1"
                      style={{
                        border:
                          paymentMethod === method
                            ? '2px solid #F0E040'
                            : '1px solid #E5E7EB',
                        backgroundColor:
                          paymentMethod === method ? '#FEFCE8' : '#FFFFFF',
                        color:
                          paymentMethod === method ? '#000000' : '#6B7280',
                        cursor: 'pointer',
                        letterSpacing: '0.06em',
                      }}
                    >
                      <span className="text-lg">{icons[method]}</span>
                      {labels[method]}
                    </button>
                  )
                })}
              </div>

              {/* Cash-specific fields */}
              {paymentMethod === 'cash' && (
                <div className="mb-6">
                  <label
                    className="font-mono text-[10px] block mb-2"
                    style={{ color: '#6B7280' }}
                  >
                    Efectivo recibido
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full font-display text-2xl text-center focus:outline-none"
                    style={{
                      border: '1px solid #E5E7EB',
                      color: '#000000',
                      padding: '14px',
                      backgroundColor: '#F9FAFB',
                    }}
                    placeholder="0.00"
                    autoFocus
                  />
                  {/* Quick cash buttons */}
                  <div className="flex gap-2 mt-2">
                    {[total, Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 20) * 20]
                      .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                      .map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setCashReceived(amount.toFixed(2))}
                          className="flex-1 font-mono text-xs py-2 min-h-[44px] transition-colors"
                          style={{
                            border: '1px solid #E5E7EB',
                            backgroundColor:
                              cashReceived === amount.toFixed(2) ? '#FEFCE8' : '#FFFFFF',
                            color: '#000000',
                            cursor: 'pointer',
                          }}
                        >
                          {amount.toFixed(2)} €
                        </button>
                      ))}
                  </div>
                  {cashReceivedNum >= total && (
                    <div
                      className="mt-3 p-4 text-center"
                      style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}
                    >
                      <p className="font-mono text-[10px]" style={{ color: '#6B7280' }}>
                        CAMBIO
                      </p>
                      <p
                        className="font-display text-2xl"
                        style={{ color: '#16A34A' }}
                      >
                        {changeAmount.toFixed(2)} €
                      </p>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'card' && (
                <div
                  className="mb-6 p-4 text-center"
                  style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                >
                  <p className="font-mono text-xs" style={{ color: '#6B7280' }}>
                    Cobra con el datáfono y confirma la venta
                  </p>
                </div>
              )}

              {paymentMethod === 'bizum' && (
                <div
                  className="mb-6 p-4 text-center"
                  style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                >
                  <p className="font-mono text-xs" style={{ color: '#6B7280' }}>
                    El cliente paga vía Bizum. Confirma cuando recibas el pago.
                  </p>
                </div>
              )}

              {error && (
                <div
                  className="mb-3 p-3 text-center"
                  style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}
                >
                  <p className="font-mono text-xs" style={{ color: '#DC2626' }}>
                    {error}
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={
                  checkoutLoading ||
                  (paymentMethod === 'cash' && cashReceivedNum < total)
                }
                className="w-full py-4 font-display text-sm min-h-[56px] transition-all"
                style={{
                  backgroundColor:
                    checkoutLoading ||
                    (paymentMethod === 'cash' && cashReceivedNum < total)
                      ? '#E5E7EB'
                      : '#F0E040',
                  color:
                    checkoutLoading ||
                    (paymentMethod === 'cash' && cashReceivedNum < total)
                      ? '#9CA3AF'
                      : '#000000',
                  cursor:
                    checkoutLoading ||
                    (paymentMethod === 'cash' && cashReceivedNum < total)
                      ? 'not-allowed'
                      : 'pointer',
                  letterSpacing: '0.08em',
                }}
              >
                {checkoutLoading
                  ? 'PROCESANDO...'
                  : paymentMethod === 'cash' && cashReceivedNum >= total
                    ? `CONFIRMAR — CAMBIO: ${changeAmount.toFixed(2)} €`
                    : 'CONFIRMAR VENTA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success modal ──────────────────────────────────────────── */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="w-full max-w-sm text-center"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div className="px-6 py-8">
              {/* Success icon */}
              <div
                className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <span style={{ fontSize: '32px' }}>✓</span>
              </div>
              <p
                className="font-display text-lg mb-2"
                style={{ color: '#16A34A', letterSpacing: '0.04em' }}
              >
                VENTA COMPLETADA
              </p>
              <p className="font-mono text-sm mb-1" style={{ color: '#000000' }}>
                {successSaleId}
              </p>
              <p className="font-mono text-[10px] mb-6" style={{ color: '#9CA3AF' }}>
                Demo — venta simulada
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-3 font-display text-sm min-h-[44px] transition-colors"
                style={{
                  backgroundColor: '#F0E040',
                  color: '#000000',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                }}
              >
                CONTINUAR · ESC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
