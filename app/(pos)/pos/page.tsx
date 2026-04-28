'use client'

// app/(pos)/pos/page.tsx
// POS — White theme with real inventory data + cash register sessions

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string
  title: string
  artists: string[]
  condition: string
  sleeve_condition: string
  format: string
  price: number
  price_physical: number
  quantity: number
  thumb: string
  barcode: string
  genres: string[]
  styles: string[]
}

interface TicketItem {
  id: string
  release_id: string
  title: string
  artists: string[]
  condition: string
  format: string
  price_base: number
  price_channel: number
  quantity: number
  stock: number
  thumb: string
}

interface Session {
  id: string
  session_number: string
  status: string
  opened_at: string
  opening_cash: number
}

type PaymentMethod = 'cash' | 'card' | 'bizum'

// ─── Component ────────────────────────────────────────────────────────────

export default function POSPage() {
  // ── Session state ────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null)
  const [showOpenSession, setShowOpenSession] = useState(false)
  const [openingCash, setOpeningCash] = useState('0')
  const [showCloseSession, setShowCloseSession] = useState(false)
  const [actualCash, setActualCash] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [closeResult, setCloseResult] = useState<Record<string, unknown> | null>(null)

  // ── POS state ────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([])
  const [searching, setSearching] = useState(false)
  const [ticket, setTicket] = useState<TicketItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [cashReceived, setCashReceived] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successSaleNumber, setSuccessSaleNumber] = useState('')
  const [discount, setDiscount] = useState(0)
  const [error, setError] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Check for active session on mount ─────────────────────────────
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/pos/sessions?limit=1')
        if (res.ok) {
          const data = await res.json()
          const open = data.sessions?.find((s: Session) => s.status === 'open')
          if (open) setSession(open)
        }
      } catch { /* ignore */ }
    }
    checkSession()
  }, [])

  // ── Open session ──────────────────────────────────────────────────
  async function handleOpenSession() {
    try {
      const res = await fetch('/api/pos/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_cash: parseFloat(openingCash) || 0 }),
      })
      const data = await res.json()
      if (res.ok) {
        setSession(data.session)
        setShowOpenSession(false)
      } else {
        setError(data.error || 'Error al abrir sesión')
      }
    } catch {
      setError('Error de conexión')
    }
  }

  // ── Close session ─────────────────────────────────────────────────
  async function handleCloseSession() {
    if (!session || !actualCash) return
    try {
      const res = await fetch(`/api/pos/sessions/${session.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_cash: parseFloat(actualCash), notes: closeNotes }),
      })
      const data = await res.json()
      if (res.ok) {
        setCloseResult(data.summary)
        setSession(null)
      } else {
        setError(data.error || 'Error al cerrar sesión')
      }
    } catch {
      setError('Error de conexión')
    }
  }

  // ── Auto-focus search ─────────────────────────────────────────────
  useEffect(() => {
    if (session) searchInputRef.current?.focus()
  }, [session])

  // ── Search inventory (server-side, debounced) ─────────────────────
  const searchInventory = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/pos/inventory?q=${encodeURIComponent(query)}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.items ?? [])
      }
    } catch { /* ignore */ }
    setSearching(false)
  }, [])

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => searchInventory(searchQuery), 250)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [searchQuery, searchInventory])

  // ── Ticket management ─────────────────────────────────────────────
  function addToTicket(item: InventoryItem) {
    setTicket(prev => {
      const existing = prev.find(t => t.id === item.id)
      if (existing) {
        if (existing.quantity < item.quantity) {
          return prev.map(t => t.id === item.id ? { ...t, quantity: t.quantity + 1 } : t)
        }
        return prev // Already at max stock
      }
      return [...prev, {
        id: item.id,
        release_id: item.id,
        title: item.title,
        artists: item.artists,
        condition: item.condition,
        format: item.format,
        price_base: item.price,
        price_channel: item.price_physical,
        quantity: 1,
        stock: item.quantity,
        thumb: item.thumb,
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
    if (qty < 1) { removeFromTicket(id); return }
    setTicket(prev => prev.map(t => t.id === id ? { ...t, quantity: Math.min(qty, t.stock) } : t))
  }

  // ── Calculations ──────────────────────────────────────────────────
  const subtotal = ticket.reduce((sum, t) => sum + t.price_channel * t.quantity, 0)
  const discountAmount = subtotal * (discount / 100)
  const totalAfterDiscount = subtotal - discountAmount
  const taxRate = 0.04
  const taxAmount = Math.round(totalAfterDiscount * taxRate / (1 + taxRate) * 100) / 100
  const total = totalAfterDiscount
  const cashReceivedNum = parseFloat(cashReceived) || 0
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, cashReceivedNum - total) : 0

  // ── Real checkout ────────────────────────────────────────────────
  async function handleCheckout() {
    if (ticket.length === 0) return
    if (paymentMethod === 'cash' && cashReceivedNum < total) {
      setError('Efectivo insuficiente')
      return
    }

    setCheckoutLoading(true)
    setError('')

    try {
      const body = {
        items: ticket.map(t => ({
          release_id: t.release_id,
          title: t.title,
          artists: t.artists,
          condition: t.condition,
          price_base: t.price_base,
          price_channel: t.price_channel,
          quantity: t.quantity,
        })),
        payment_method: paymentMethod,
        session_id: session?.id,
        discount_percentage: discount,
        cash_received: paymentMethod === 'cash' ? cashReceivedNum : null,
      }

      const res = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al procesar la venta')
        setCheckoutLoading(false)
        return
      }

      setSuccessSaleNumber(data.sale_number || '')
      setShowCheckout(false)
      setShowSuccess(true)
      setTicket([])
      setCashReceived('')
      setDiscount(0)
    } catch {
      setError('Error de conexión con el servidor')
    }

    setCheckoutLoading(false)
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus(); searchInputRef.current?.select() }
      if (e.key === 'F9' && ticket.length > 0 && !showCheckout) { e.preventDefault(); setShowCheckout(true) }
      if (e.key === 'Escape') { showSuccess ? setShowSuccess(false) : setShowCheckout(false) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [ticket.length, showCheckout, showSuccess])

  function isInTicket(id: string) { return ticket.some(t => t.id === id) }
  function getTicketQty(id: string) { return ticket.find(t => t.id === id)?.quantity ?? 0 }

  // ─── RENDER ────────────────────────────────────────────────────────────

  // No session → show open session screen
  if (!session && !closeResult) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
            <span style={{ fontSize: '36px' }}>🟡</span>
          </div>
          <h1 className="font-display text-xl mb-2" style={{ color: '#000000', letterSpacing: '0.04em' }}>ABRIR CAJA</h1>
          <p className="font-mono text-xs mb-8" style={{ color: '#6B7280' }}>Inicia una sesión de caja para comenzar a vender</p>

          <div className="mb-6 text-left">
            <label className="font-mono text-[10px] block mb-2" style={{ color: '#6B7280' }}>EFECTIVO INICIAL EN CAJA</label>
            <input
              type="number" step="0.01" value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              className="w-full font-display text-3xl text-center focus:outline-none"
              style={{ border: '1px solid #E5E7EB', color: '#000000', padding: '16px', backgroundColor: '#F9FAFB' }}
              placeholder="0.00" autoFocus
            />
          </div>

          {error && <p className="font-mono text-xs mb-4" style={{ color: '#EF4444' }}>{error}</p>}

          <button onClick={handleOpenSession}
            className="w-full py-4 font-display text-sm min-h-[56px]"
            style={{ backgroundColor: '#F0E040', color: '#000000', cursor: 'pointer', letterSpacing: '0.08em' }}>
            ABRIR SESIÓN
          </button>

          <button onClick={async () => {
            try {
              const res = await fetch('/api/pos/sessions?limit=1')
              if (res.ok) { const data = await res.json(); const open = data.sessions?.find((s: Session) => s.status === 'open'); if (open) setSession(open) }
            } catch { /* ignore */ }
          }} className="w-full py-3 font-mono text-xs mt-3 min-h-[44px]" style={{ color: '#6B7280', cursor: 'pointer' }}>
            Recargar sesión activa
          </button>
        </div>
      </div>
    )
  }

  // Close result → show Z-report
  if (closeResult) {
    const r = closeResult as Record<string, number>
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
              <span style={{ fontSize: '28px' }}>✓</span>
            </div>
            <h2 className="font-display text-xl" style={{ color: '#16A34A', letterSpacing: '0.04em' }}>CAJA CERRADA</h2>
          </div>

          <div className="space-y-3 p-6" style={{ border: '1px solid #E5E7EB' }}>
            {[
              ['Efectivo inicial', r.opening_cash],
              ['+ Ventas efectivo', r.cash_sales],
              ['= Efectivo esperado', r.expected_cash],
              ['Efectivo contado', r.actual_cash],
              [(r.difference || 0) >= 0 ? 'Sobrante' : 'Descuadre', r.difference],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between">
                <span className="font-mono text-xs" style={{ color: '#6B7280' }}>{label}</span>
                <span className="font-mono text-sm font-bold" style={{
                  color: label === 'Descuadre' ? '#EF4444' : label === 'Sobrante' ? '#16A34A' : '#000000'
                }}>{Number(value || 0).toFixed(2)} €</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #E5E7EB', margin: '12px 0' }} />
            {[
              ['Ventas totales', r.total_sales, 'uds'],
              ['Tarjeta', r.total_card, '€'],
              ['Bizum', r.total_bizum, '€'],
              ['Descuentos', r.total_discount, '€'],
            ].map(([label, value, unit]) => (
              <div key={String(label)} className="flex justify-between">
                <span className="font-mono text-xs" style={{ color: '#6B7280' }}>{label}</span>
                <span className="font-mono text-xs" style={{ color: '#000000' }}>{unit === 'uds' ? value : Number(value || 0).toFixed(2)} {unit}</span>
              </div>
            ))}
          </div>

          <button onClick={() => { setCloseResult(null); setActualCash(''); setCloseNotes('') }}
            className="w-full py-4 font-display text-sm mt-4 min-h-[56px]"
            style={{ backgroundColor: '#F0E040', color: '#000000', cursor: 'pointer', letterSpacing: '0.08em' }}>
            NUEVA SESIÓN
          </button>
        </div>
      </div>
    )
  }

  // ── Main POS interface ────────────────────────────────────────────
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel: Search */}
      <div className="w-[45%] flex flex-col" style={{ borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
        {/* Session bar */}
        <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FEFCE8' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#16A34A' }} />
            <span className="font-mono text-[10px]" style={{ color: '#000000' }}>{session?.session_number}</span>
          </div>
          <button onClick={() => setShowCloseSession(true)}
            className="font-mono text-[10px] px-2 py-1 min-h-[32px]" style={{ border: '1px solid #E5E7EB', color: '#6B7280', cursor: 'pointer' }}>
            Cerrar caja
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>F2</span>
            <div className="flex-1 relative">
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar disco, artista, código de barras..." className="w-full font-mono text-sm focus:outline-none"
                style={{ border: '1px solid #E5E7EB', color: '#000000', padding: '11px 14px', backgroundColor: '#F9FAFB' }} />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); searchInputRef.current?.focus() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center" style={{ color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="font-mono text-[10px]" style={{ color: '#9CA3AF' }}>
              {searching ? 'Buscando...' : searchQuery ? `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''}` : 'Escribe para buscar en el inventario'}
            </p>
            <p className="font-mono text-[10px]" style={{ color: '#D1D5DB' }}>Precio tienda (×0.95)</p>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="text-center py-12">
              <p className="font-mono text-xs" style={{ color: '#9CA3AF' }}>Sin resultados para &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
          {searchResults.length === 0 && !searchQuery && (
            <div className="text-center py-12">
              <p className="font-mono text-xs" style={{ color: '#9CA3AF' }}>Busca un disco por título, artista o código de barras</p>
              <p className="font-mono text-[10px] mt-1" style={{ color: '#D1D5DB' }}>F2 buscar · F9 cobrar</p>
            </div>
          )}
          {searchResults.map(record => {
            const inTicket = isInTicket(record.id)
            const ticketQty = getTicketQty(record.id)
            return (
              <button key={record.id} onClick={() => addToTicket(record)}
                className="w-full flex items-center gap-3 p-3 text-left transition-all min-h-[64px]"
                style={{ border: inTicket ? '2px solid #F0E040' : '1px solid #E5E7EB', backgroundColor: inTicket ? '#FEFCE8' : '#FFFFFF', cursor: 'pointer' }}>
                <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                  {record.thumb ? (
                    <img src={record.thumb} alt="" className="w-full h-full object-cover" style={{ minHeight: '44px' }} />
                  ) : (
                    <span className="font-display text-[10px]" style={{ color: '#9CA3AF' }}>♪</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[11px] truncate" style={{ color: '#000000' }}>{record.artists.join(', ')} — {record.title}</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: '#6B7280' }}>
                    {record.condition}{record.sleeve_condition ? ` / ${record.sleeve_condition}` : ''} · {record.format} · Stock: {record.quantity}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-sm font-bold" style={{ color: '#000000' }}>{record.price_physical.toFixed(2)} €</p>
                  {record.price_physical !== record.price && (
                    <p className="font-mono text-[9px] line-through" style={{ color: '#D1D5DB' }}>{record.price.toFixed(2)}</p>
                  )}
                  {inTicket && <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ backgroundColor: '#F0E040', color: '#000000' }}>×{ticketQty}</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right panel: Ticket */}
      <div className="w-[55%] flex flex-col" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xs" style={{ color: '#000000', letterSpacing: '0.08em' }}>TICKET</h2>
            {ticket.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ backgroundColor: '#F0E040', color: '#000000' }}>
                {ticket.reduce((s, t) => s + t.quantity, 0)} ud{ticket.reduce((s, t) => s + t.quantity, 0) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {ticket.length > 0 && (
            <button onClick={() => setTicket([])} className="font-mono text-[10px] min-h-[44px] flex items-center px-2" style={{ color: '#9CA3AF', cursor: 'pointer' }}>Limpiar</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {ticket.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8">
              <div className="w-16 h-16 flex items-center justify-center mb-4" style={{ backgroundColor: '#F3F4F6' }}>
                <span style={{ color: '#9CA3AF', fontSize: '24px' }}>♪</span>
              </div>
              <p className="font-mono text-xs text-center" style={{ color: '#9CA3AF' }}>Busca o haz clic en un disco</p>
              <p className="font-mono text-[10px] mt-1" style={{ color: '#D1D5DB' }}>F2 buscar · F9 cobrar</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {ticket.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                    {item.thumb ? (
                      <img src={item.thumb} alt="" className="w-full h-full object-cover" style={{ minHeight: '36px' }} />
                    ) : (
                      <span className="font-display text-[9px]" style={{ color: '#9CA3AF' }}>♪</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[10px] truncate" style={{ color: '#000000' }}>{item.artists.join(', ')} — {item.title}</p>
                    <p className="font-mono text-[10px]" style={{ color: '#6B7280' }}>{item.price_channel.toFixed(2)} €/ud · {item.condition} · {item.format}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateTicketQty(item.id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center font-mono text-sm" style={{ border: '1px solid #E5E7EB', color: '#000000', backgroundColor: '#FFFFFF', cursor: 'pointer', minHeight: '44px', minWidth: '44px' }}>−</button>
                    <span className="font-mono text-sm w-8 text-center" style={{ color: '#000000' }}>{item.quantity}</span>
                    <button onClick={() => updateTicketQty(item.id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center font-mono text-sm" style={{ border: '1px solid #E5E7EB', color: item.quantity >= item.stock ? '#D1D5DB' : '#000000', cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer', opacity: item.quantity >= item.stock ? 0.4 : 1, minHeight: '44px', minWidth: '44px' }}>+</button>
                  </div>
                  <div className="text-right flex-shrink-0 w-20">
                    <p className="font-mono text-sm font-bold" style={{ color: '#000000' }}>{(item.price_channel * item.quantity).toFixed(2)} €</p>
                  </div>
                  <button onClick={() => removeFromTicket(item.id)} className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ color: '#EF4444', cursor: 'pointer', minHeight: '44px', minWidth: '44px' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discount */}
        {ticket.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
            <span className="font-mono text-xs" style={{ color: '#6B7280' }}>Descuento</span>
            <div className="flex items-center gap-2">
              {[0, 5, 10, 15, 20].map(d => (
                <button key={d} onClick={() => setDiscount(d)} className="font-mono text-[11px] px-2.5 py-1 min-h-[36px] flex items-center"
                  style={{ border: discount === d ? '2px solid #F0E040' : '1px solid #E5E7EB', backgroundColor: discount === d ? '#FEFCE8' : '#FFFFFF', color: discount === d ? '#000000' : '#6B7280', cursor: 'pointer' }}>
                  {d}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
          {discount > 0 && (
            <div className="flex justify-between mb-1.5">
              <span className="font-mono text-xs" style={{ color: '#6B7280' }}>Descuento ({discount}%)</span>
              <span className="font-mono text-xs" style={{ color: '#EF4444' }}>−{discountAmount.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[10px]" style={{ color: '#9CA3AF' }}>IVA incl. (4%)</span>
            <span className="font-mono text-[10px]" style={{ color: '#9CA3AF' }}>{taxAmount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-baseline mt-3 mb-4 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
            <span className="font-display text-lg" style={{ color: '#000000' }}>TOTAL</span>
            <span className="font-display text-2xl" style={{ color: '#000000' }}>{total.toFixed(2)} €</span>
          </div>
          <button onClick={() => setShowCheckout(true)} disabled={ticket.length === 0}
            className="w-full py-4 font-display text-sm transition-all min-h-[56px]"
            style={{ backgroundColor: ticket.length === 0 ? '#E5E7EB' : '#F0E040', color: ticket.length === 0 ? '#9CA3AF' : '#000000', cursor: ticket.length === 0 ? 'not-allowed' : 'pointer', letterSpacing: '0.08em' }}>
            COBRAR · F9
          </button>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <h2 className="font-display text-sm" style={{ color: '#000000', letterSpacing: '0.08em' }}>COBRO</h2>
              <button onClick={() => setShowCheckout(false)} className="font-mono text-xs min-h-[44px] flex items-center gap-1 px-2" style={{ color: '#6B7280', cursor: 'pointer' }}>✕ <span style={{ color: '#9CA3AF' }}>ESC</span></button>
            </div>
            <div className="px-6 py-6">
              <div className="text-center mb-6">
                <p className="font-mono text-[10px] mb-1" style={{ color: '#9CA3AF' }}>TOTAL A COBRAR</p>
                <p className="font-display text-4xl" style={{ color: '#000000' }}>{total.toFixed(2)} €</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {(['card', 'cash', 'bizum'] as PaymentMethod[]).map(method => {
                  const labels: Record<PaymentMethod, string> = { card: 'TARJETA', cash: 'EFECTIVO', bizum: 'BIZUM' }
                  const icons: Record<PaymentMethod, string> = { card: '💳', cash: '💶', bizum: '📱' }
                  return (
                    <button key={method} onClick={() => { setPaymentMethod(method); setError('') }}
                      className="py-3 font-display text-[10px] min-h-[52px] transition-all flex flex-col items-center gap-1"
                      style={{ border: paymentMethod === method ? '2px solid #F0E040' : '1px solid #E5E7EB', backgroundColor: paymentMethod === method ? '#FEFCE8' : '#FFFFFF', color: paymentMethod === method ? '#000000' : '#6B7280', cursor: 'pointer', letterSpacing: '0.06em' }}>
                      <span className="text-lg">{icons[method]}</span>{labels[method]}
                    </button>
                  )
                })}
              </div>
              {paymentMethod === 'cash' && (
                <div className="mb-6">
                  <label className="font-mono text-[10px] block mb-2" style={{ color: '#6B7280' }}>Efectivo recibido</label>
                  <input type="number" step="0.01" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                    className="w-full font-display text-2xl text-center focus:outline-none"
                    style={{ border: '1px solid #E5E7EB', color: '#000000', padding: '14px', backgroundColor: '#F9FAFB' }} placeholder="0.00" autoFocus />
                  <div className="flex gap-2 mt-2">
                    {[total, Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 20) * 20]
                      .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                      .map(amount => (
                        <button key={amount} onClick={() => setCashReceived(amount.toFixed(2))} className="flex-1 font-mono text-xs py-2 min-h-[44px]"
                          style={{ border: '1px solid #E5E7EB', backgroundColor: cashReceived === amount.toFixed(2) ? '#FEFCE8' : '#FFFFFF', color: '#000000', cursor: 'pointer' }}>
                          {amount.toFixed(2)} €
                        </button>
                      ))}
                  </div>
                  {cashReceivedNum >= total && (
                    <div className="mt-3 p-4 text-center" style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
                      <p className="font-mono text-[10px]" style={{ color: '#6B7280' }}>CAMBIO</p>
                      <p className="font-display text-2xl" style={{ color: '#16A34A' }}>{changeAmount.toFixed(2)} €</p>
                    </div>
                  )}
                </div>
              )}
              {paymentMethod === 'card' && <div className="mb-6 p-4 text-center" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}><p className="font-mono text-xs" style={{ color: '#6B7280' }}>Cobra con el datáfono y confirma</p></div>}
              {paymentMethod === 'bizum' && <div className="mb-6 p-4 text-center" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}><p className="font-mono text-xs" style={{ color: '#6B7280' }}>Confirma cuando recibas el pago Bizum</p></div>}
              {error && <div className="mb-3 p-3 text-center" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}><p className="font-mono text-xs" style={{ color: '#DC2626' }}>{error}</p></div>}
              <button onClick={handleCheckout} disabled={checkoutLoading || (paymentMethod === 'cash' && cashReceivedNum < total)}
                className="w-full py-4 font-display text-sm min-h-[56px] transition-all"
                style={{ backgroundColor: checkoutLoading || (paymentMethod === 'cash' && cashReceivedNum < total) ? '#E5E7EB' : '#F0E040', color: checkoutLoading || (paymentMethod === 'cash' && cashReceivedNum < total) ? '#9CA3AF' : '#000000', cursor: checkoutLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.08em' }}>
                {checkoutLoading ? 'PROCESANDO...' : paymentMethod === 'cash' && cashReceivedNum >= total ? `CONFIRMAR — CAMBIO: ${changeAmount.toFixed(2)} €` : 'CONFIRMAR VENTA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-sm text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="px-6 py-8">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}><span style={{ fontSize: '32px' }}>✓</span></div>
              <p className="font-display text-lg mb-2" style={{ color: '#16A34A', letterSpacing: '0.04em' }}>VENTA COMPLETADA</p>
              <p className="font-mono text-sm mb-1" style={{ color: '#000000' }}>{successSaleNumber}</p>
              <button onClick={() => setShowSuccess(false)} className="w-full py-3 font-display text-sm mt-6 min-h-[44px]" style={{ backgroundColor: '#F0E040', color: '#000000', cursor: 'pointer', letterSpacing: '0.08em' }}>CONTINUAR · ESC</button>
            </div>
          </div>
        </div>
      )}

      {/* Close session modal */}
      {showCloseSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <h2 className="font-display text-sm" style={{ color: '#000000', letterSpacing: '0.08em' }}>CIERRE DE CAJA</h2>
            </div>
            <div className="px-6 py-6">
              <p className="font-mono text-xs mb-4" style={{ color: '#6B7280' }}>Sesión: {session?.session_number}</p>
              <div className="mb-4">
                <label className="font-mono text-[10px] block mb-2" style={{ color: '#6B7280' }}>EFECTIVO CONTADO</label>
                <input type="number" step="0.01" value={actualCash} onChange={e => setActualCash(e.target.value)}
                  className="w-full font-display text-2xl text-center focus:outline-none"
                  style={{ border: '1px solid #E5E7EB', color: '#000000', padding: '14px', backgroundColor: '#F9FAFB' }} placeholder="0.00" autoFocus />
              </div>
              <div className="mb-4">
                <label className="font-mono text-[10px] block mb-2" style={{ color: '#6B7280' }}>NOTAS (OPCIONAL)</label>
                <input type="text" value={closeNotes} onChange={e => setCloseNotes(e.target.value)}
                  className="w-full font-mono text-sm focus:outline-none"
                  style={{ border: '1px solid #E5E7EB', color: '#000000', padding: '10px', backgroundColor: '#F9FAFB' }} placeholder="Incidencias, observaciones..." />
              </div>
              {error && <p className="font-mono text-xs mb-3" style={{ color: '#EF4444' }}>{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setShowCloseSession(false); setError('') }}
                  className="flex-1 py-3 font-mono text-xs min-h-[44px]" style={{ border: '1px solid #E5E7EB', color: '#6B7280', cursor: 'pointer' }}>
                  CANCELAR
                </button>
                <button onClick={handleCloseSession} disabled={!actualCash}
                  className="flex-1 py-3 font-display text-sm min-h-[44px]"
                  style={{ backgroundColor: actualCash ? '#F0E040' : '#E5E7EB', color: '#000000', cursor: actualCash ? 'pointer' : 'not-allowed', letterSpacing: '0.06em' }}>
                  CERRAR CAJA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
