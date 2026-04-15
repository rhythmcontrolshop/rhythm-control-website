'use client'
import { useState, useEffect, useCallback } from 'react'
import InventoryActions from './InventoryActions'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:   { label: 'ACTIVO',    color: '#22c55e' },
  reserved: { label: 'GUARDI',    color: '#f59e0b' },
  sold:     { label: 'VENDIDO',   color: '#ef4444' },
  hidden:   { label: 'OCULTO',    color: '#6b7280' },
  gifted:   { label: 'REGALADO',  color: '#8b5cf6' },
}

const STATUS_FILTERS = [
  { value: '',     label: 'TODOS' },
  { value: 'active',   label: 'ACTIVO' },
  { value: 'reserved', label: 'GUARDI' },
  { value: 'sold',     label: 'VENDIDO' },
  { value: 'hidden',   label: 'OCULTO' },
]

interface ReleaseRow {
  id: string; title: string; artists: string[]; condition: string
  price: number; status: string; thumb: string; quantity: number
  barcode: string | null; location: string | null; discogs_listing_id: number
  genres: string[] | null; styles: string[] | null; format: string | null
}

export default function InventoryPage() {
  const [items, setItems]         = useState<ReleaseRow[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    params.set('limit', '50')

    const res = await fetch(`/api/admin/inventory?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    }
    setLoading(false)
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => { fetchItems() }, [fetchItems])

  // Stats
  const active = items.filter(r => r.status === 'active').length
  const withBarcode = items.filter(r => r.barcode).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>INVENTARIO</h1>
        <span className="text-xs" style={{ color: '#6b7280' }}>{total} registros</span>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar artista o titulo..."
          className="flex-1 text-sm px-4 py-2 focus:outline-none"
          style={{ border: '1px solid #d1d5db', color: '#000000' }}
        />
        <div className="flex gap-0" style={{ border: '1px solid #d1d5db' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className="text-xs px-3 py-2 transition-colors whitespace-nowrap"
              style={{
                backgroundColor: statusFilter === f.value ? '#000000' : '#FFFFFF',
                color:           statusFilter === f.value ? '#FFFFFF' : '#6b7280',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-xs animate-pulse py-8 text-center" style={{ color: '#6b7280' }}>CARGANDO...</p>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr style={{ borderBottom: '2px solid #000000' }}>
                {['', 'ARTISTA / TITULO', 'COND.', 'UDS.', 'PRECIO', 'BARCODE', 'UBIC.', 'ESTADO', ''].map((h, i) => (
                  <th key={i} className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-sm" style={{ color: '#9ca3af' }}>
                    Sin resultados
                  </td>
                </tr>
              )}
              {items.map(r => {
                const st = STATUS_MAP[r.status ?? 'active'] ?? STATUS_MAP.active
                return (
                  <tr key={r.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="px-3 py-3 w-12">
                      {r.thumb
                        ? <img src={r.thumb} alt="" className="w-10 h-10 object-cover" style={{ border: '1px solid #d1d5db' }} />
                        : <div className="w-10 h-10" style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-bold" style={{ color: '#000000' }}>{r.artists?.[0] ?? '—'}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{r.title}</p>
                      {r.genres?.length && (
                        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{r.genres.join(', ')}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>{r.condition ?? '—'}</td>
                    <td className="px-3 py-3">
                      <span className="text-sm font-bold" style={{ color: r.quantity > 0 ? '#000000' : '#ef4444' }}>
                        {r.quantity ?? 1}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                      {r.price?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      {r.barcode ? (
                        <span className="text-xs font-mono px-2 py-1"
                          style={{ backgroundColor: '#f3f4f6', color: '#000000', border: '1px solid #d1d5db' }}>
                          {r.barcode}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: r.location ? '#000000' : '#9ca3af' }}>
                      {r.location || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{ color: st.color, border: `1px solid ${st.color}`, backgroundColor: st.color + '10' }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <InventoryActions
                        releaseId={r.id}
                        currentStatus={r.status ?? 'active'}
                        barcode={r.barcode}
                        quantity={r.quantity ?? 1}
                        location={r.location}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4"
          style={{ borderTop: '1px solid #e5e7eb' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="text-xs px-4 py-2 disabled:opacity-30 transition-colors hover:bg-black hover:text-white"
            style={{ border: '1px solid #d1d5db', color: '#374151' }}>
            ANTERIOR
          </button>
          <span className="text-xs" style={{ color: '#6b7280' }}>
            Pagina {page} de {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="text-xs px-4 py-2 disabled:opacity-30 transition-colors hover:bg-black hover:text-white"
            style={{ border: '1px solid #d1d5db', color: '#374151' }}>
            SIGUIENTE
          </button>
        </div>
      )}
    </div>
  )
}
