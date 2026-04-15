'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  created:    { label: 'CREADO',      color: '#6b7280' },
  pending:    { label: 'PENDIENTE',   color: '#f59e0b' },
  paid:       { label: 'PAGADO',      color: '#22c55e' },
  confirmed:  { label: 'CONFIRMADO',  color: '#22c55e' },
  processing: { label: 'PREPARANDO',  color: '#3b82f6' },
  shipped:    { label: 'ENVIADO',     color: '#8b5cf6' },
  delivered:  { label: 'ENTREGADO',   color: '#10b981' },
  collected:  { label: 'RECOGIDO',    color: '#10b981' },
  cancelled:  { label: 'CANCELADO',   color: '#ef4444' },
  refunded:   { label: 'REEMBOLSADO', color: '#9ca3af' },
}

const FULFILLMENT: Record<string, string> = {
  pickup: 'GUARDI',
  shipping: 'ENVIO',
}

const STATUS_OPTIONS = [
  { value: '',              label: 'Todos los estados' },
  { value: 'created',      label: 'Creado' },
  { value: 'pending',      label: 'Pendiente' },
  { value: 'paid',         label: 'Pagado' },
  { value: 'confirmed',    label: 'Confirmado' },
  { value: 'processing',   label: 'Preparando' },
  { value: 'shipped',      label: 'Enviado' },
  { value: 'delivered',    label: 'Entregado' },
  { value: 'collected',    label: 'Recogido' },
  { value: 'cancelled',    label: 'Cancelado' },
  { value: 'refunded',     label: 'Reembolsado' },
]

const TYPE_OPTIONS = [
  { value: '',       label: 'Todos los tipos' },
  { value: 'pickup', label: 'GUARDI' },
  { value: 'shipping', label: 'ENVIO' },
]

interface Order {
  id: string; order_number: string; status: string; payment_status: string
  fulfillment_type: string; customer_name: string | null; customer_email: string | null
  total_amount: number; shipping_cost: number; pickup_code: string | null
  created_at: string; updated_at: string
}

interface Stats {
  todayOrders: number; totalRevenue: number
  statusCounts: Record<string, number>
}

export default function PedidosPage() {
  const [orders, setOrders]     = useState<Order[]>([])
  const [stats, setStats]       = useState<Stats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filtros
  const [search, setSearch]             = useState('')
  const [debouncedSearch, setDebounced]  = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter]     = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter, typeFilter])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '25')
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('type', typeFilter)

    const res = await fetch(`/api/admin/orders?${params}`)
    if (res.ok) {
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setStats(data.stats ?? null)
    }
    setLoading(false)
  }, [page, debouncedSearch, statusFilter, typeFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const pendingCount = stats?.statusCounts?.pending ?? 0
  const paidCount = stats?.statusCounts?.paid ?? 0
  const processingCount = (stats?.statusCounts?.processing ?? 0) + (stats?.statusCounts?.confirmed ?? 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>PEDIDOS</h1>
        <div className="flex gap-4">
          <span className="text-xs" style={{ color: '#f59e0b' }}>{pendingCount} pendiente(s)</span>
          <span className="text-xs" style={{ color: '#22c55e' }}>{paidCount} pagado(s)</span>
          <span className="text-xs" style={{ color: '#3b82f6' }}>{processingCount} en proceso</span>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
            <p className="text-xs" style={{ color: '#6b7280' }}>PEDIDOS HOY</p>
            <p className="text-2xl font-bold" style={{ color: '#000000' }}>{stats.todayOrders}</p>
          </div>
          <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
            <p className="text-xs" style={{ color: '#6b7280' }}>REVENUE TOTAL</p>
            <p className="text-2xl font-bold" style={{ color: '#000000' }}>
              {(stats.totalRevenue / 100).toFixed(2)} <span className="text-sm">EUR</span>
            </p>
          </div>
          <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
            <p className="text-xs" style={{ color: '#6b7280' }}>TOTAL PEDIDOS</p>
            <p className="text-2xl font-bold" style={{ color: '#000000' }}>{total}</p>
          </div>
          <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
            <p className="text-xs" style={{ color: '#6b7280' }}>CANCELADOS</p>
            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
              {stats.statusCounts?.cancelled ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar pedido, cliente, email, codigo..."
          className="flex-1 text-sm px-4 py-2 focus:outline-none"
          style={{ border: '1px solid #d1d5db', color: '#000000', minWidth: '200px' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm px-4 py-2 focus:outline-none"
          style={{ border: '1px solid #d1d5db', color: '#000000' }}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-sm px-4 py-2 focus:outline-none"
          style={{ border: '1px solid #d1d5db', color: '#000000' }}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-xs animate-pulse py-8 text-center" style={{ color: '#6b7280' }}>CARGANDO...</p>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: '#6b7280' }}>Sin pedidos.</p>
          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
            Los pedidos apareceran aqui cuando los clientes completen el checkout.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto" style={{ border: '1px solid #d1d5db' }}>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  <th className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>PEDIDO</th>
                  <th className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>CLIENTE</th>
                  <th className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>TIPO</th>
                  <th className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>TOTAL</th>
                  <th className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>PAGO</th>
                  <th className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>ESTADO</th>
                  <th className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>CODIGO</th>
                  <th className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>FECHA</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const st = STATUS_MAP[o.status] ?? STATUS_MAP.pending
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 cursor-pointer"
                      style={{ borderBottom: '1px solid #e5e7eb' }}
                      onClick={() => window.location.href = `/admin/pedidos/${o.id}`}>
                      <td className="p-3">
                        <Link href={`/admin/pedidos/${o.id}`}
                          className="text-sm font-mono font-bold" style={{ color: '#000000' }}
                          onClick={e => e.stopPropagation()}>
                          #{o.order_number ?? o.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="p-3">
                        <p className="text-sm" style={{ color: '#000000' }}>{o.customer_name ?? '—'}</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>{o.customer_email ?? ''}</p>
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1" style={{ border: '1px solid #d1d5db', color: '#374151' }}>
                          {FULFILLMENT[o.fulfillment_type] ?? o.fulfillment_type ?? '—'}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-bold" style={{ color: '#000000' }}>
                        {o.total_amount ? (o.total_amount / 100).toFixed(2) + ' EUR' : '—'}
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1"
                          style={{
                            color: o.payment_status === 'paid' ? '#22c55e' : '#f59e0b',
                            border: `1px solid ${o.payment_status === 'paid' ? '#22c55e' : '#f59e0b'}`
                          }}>
                          {o.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1"
                          style={{ color: st.color, border: `1px solid ${st.color}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3">
                        {o.pickup_code
                          ? <span className="text-xs font-mono px-2 py-1"
                              style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', color: '#000000' }}>
                              {o.pickup_code}
                            </span>
                          : <span className="text-xs" style={{ color: '#9ca3af' }}>—</span>
                        }
                      </td>
                      <td className="p-3 text-xs" style={{ color: '#6b7280' }}>
                        {new Date(o.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Mostrando {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-xs px-4 py-2 disabled:opacity-30 transition-colors hover:bg-gray-100"
                  style={{ border: '1px solid #d1d5db', color: '#374151' }}>
                  ANTERIOR
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className="text-xs px-3 py-2 transition-colors"
                      style={{
                        border: '1px solid #d1d5db',
                        backgroundColor: pageNum === page ? '#000000' : '#FFFFFF',
                        color: pageNum === page ? '#FFFFFF' : '#374151',
                      }}>
                      {pageNum}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="text-xs px-4 py-2 disabled:opacity-30 transition-colors hover:bg-gray-100"
                  style={{ border: '1px solid #d1d5db', color: '#374151' }}>
                  SIGUIENTE
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
