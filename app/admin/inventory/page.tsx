'use client'

import { useState, useEffect } from 'react'
import InventoryActions from './InventoryActions'

const STATUS: Record<string, { label: string; color: string }> = {
  active:   { label: 'ACTIVO',    color: '#22c55e' },
  reserved: { label: 'RESERVADO', color: '#f59e0b' },
  sold:     { label: 'VENDIDO',   color: '#ef4444' },
  hidden:   { label: 'OCULTO',    color: '#6b7280' },
  gifted:   { label: 'REGALADO',  color: '#8b5cf6' },
}

interface ReleaseRow {
  id: string
  title: string
  artists: string[]
  condition: string
  price: number
  status: string
  thumb: string
  quantity: number
  barcode: string | null
  location: string | null
  discogs_listing_id: number
  format: string
  year: number | null
  weight_grams: number | null
}

type SortField = 'artist' | 'title' | 'price' | 'condition' | 'year' | 'status' | 'quantity' | 'format'
type SortDir = 'asc' | 'desc'

export default function InventoryPage() {
  const [releases, setReleases] = useState<ReleaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('artist')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [savingQty, setSavingQty] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/catalogue?limit=500')
      .then(r => r.json())
      .then(data => {
        setReleases(data.data ?? data ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function updateQuantity(releaseId: string, newQty: number) {
    setSavingQty(releaseId)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty }),
    })
    setReleases(prev => prev.map(r => r.id === releaseId ? { ...r, quantity: newQty } : r))
    setSavingQty(null)
  }

  const filtered = filter === 'all' ? releases :
    filter === 'active' ? releases.filter(r => r.status === 'active') :
    filter === 'sold' ? releases.filter(r => r.status === 'sold') :
    filter === 'reserved' ? releases.filter(r => r.status === 'reserved') :
    releases

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'artist': cmp = (a.artists?.[0] ?? '').localeCompare(b.artists?.[0] ?? ''); break
      case 'title': cmp = a.title.localeCompare(b.title); break
      case 'price': cmp = a.price - b.price; break
      case 'condition': cmp = (a.condition ?? '').localeCompare(b.condition ?? ''); break
      case 'year': cmp = (a.year ?? 0) - (b.year ?? 0); break
      case 'status': cmp = (a.status ?? '').localeCompare(b.status ?? ''); break
      case 'quantity': cmp = (a.quantity ?? 1) - (b.quantity ?? 1); break
      case 'format': cmp = (a.format ?? '').localeCompare(b.format ?? ''); break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const total = releases.length
  const active = releases.filter(r => r.status === 'active').length
  const withBarcode = releases.filter(r => r.barcode).length
  const totalUnits = releases.reduce((sum, r) => sum + (r.quantity || 1), 0)

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const isActive = sortField === field
    return (
      <th className="text-xs font-medium px-3 py-3 cursor-pointer select-none"
        style={{ color: isActive ? '#000000' : '#6b7280' }}
        onClick={() => toggleSort(field)}>
        <span className="inline-flex items-center gap-1">
          {label}
          <span style={{ fontSize: '10px', opacity: isActive ? 1 : 0.3 }}>
            {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
          </span>
        </span>
      </th>
    )
  }

  if (loading) return <div className="p-6"><p className="text-sm" style={{ color: '#6b7280' }}>Cargando inventario...</p></div>

  return (
    <div className="p-6">
      {error && (
        <div className="p-4 mb-6" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-sm" style={{ color: '#ef4444' }}>Error: {error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>INVENTARIO</h1>
        <div className="flex gap-4 text-xs" style={{ color: '#6b7280' }}>
          <span>{total} registros</span>
          <span style={{ color: '#22c55e' }}>{active} activos</span>
          <span>{totalUnits} unidades</span>
          <span>{withBarcode} con código de barras</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'TODOS' },
          { key: 'active', label: 'EN VENTA' },
          { key: 'sold', label: 'VENDIDOS' },
          { key: 'reserved', label: 'GUARDI' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="text-xs px-4 py-2 transition-colors duration-150"
            style={{
              backgroundColor: filter === f.key ? '#000000' : '#FFFFFF',
              color: filter === f.key ? '#FFFFFF' : '#374151',
              border: '1px solid ' + (filter === f.key ? '#000000' : '#d1d5db'),
              cursor: 'pointer',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '2px solid #000000' }}>
              <th className="text-xs font-medium px-3 py-3 w-12" style={{ color: '#6b7280' }}></th>
              <SortHeader field="artist" label="ARTISTA" />
              <SortHeader field="title" label="TÍTULO" />
              <SortHeader field="condition" label="COND." />
              <SortHeader field="format" label="FORMATO" />
              <SortHeader field="quantity" label="UDS." />
              <SortHeader field="price" label="PRECIO" />
              <th className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>BARCODE</th>
              <th className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>UBIC.</th>
              <SortHeader field="status" label="ESTADO" />
              <th className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => {
              const st = STATUS[r.status ?? 'active'] ?? STATUS.active
              return (
                <tr key={r.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="px-3 py-3 w-12">
                    {r.thumb
                      ? <img src={r.thumb} alt="" className="w-10 h-10 object-cover" style={{ border: '1px solid #d1d5db' }} />
                      : <div className="w-10 h-10" style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>{r.artists?.[0] ?? '—'}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#374151' }}>{r.title}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#000000' }}>{r.condition ?? '—'}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#374151' }}>{r.format ?? '—'}</td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      defaultValue={r.quantity ?? 1}
                      disabled={savingQty === r.id}
                      className="w-14 text-sm font-bold text-center focus:outline-none"
                      style={{
                        border: savingQty === r.id ? '1px solid #f59e0b' : '1px solid #d1d5db',
                        color: r.quantity > 1 ? '#000000' : '#9ca3af',
                        padding: '2px 4px',
                        backgroundColor: '#FFFFFF',
                      }}
                      onBlur={async (e) => {
                        const newQty = parseInt(e.target.value) || 0
                        if (newQty !== (r.quantity ?? 1)) {
                          await updateQuantity(r.id, newQty)
                        }
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur()
                        }
                      }}
                    />
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
                      style={{
                        color: st.color,
                        border: `1px solid ${st.color}`,
                        backgroundColor: st.color + '10',
                      }}>
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

      <div className="mt-10 pt-8" style={{ borderTop: '2px solid #000000' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>PERFILES DE PESO / PRECIO</h2>
        <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
          Configura perfiles de peso para calcular automáticamente los costes de envío.
          Los perfiles se asocian al formato del disco.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { format: 'LP', weight: '180–230g', desc: 'Álbum estándar 12"' },
            { format: 'Doble LP', weight: '360–460g', desc: 'Álbum doble 12"' },
            { format: '7"', weight: '40–60g', desc: 'Sencillo 7 pulgadas' },
          ].map(profile => (
            <div key={profile.format} className="p-4" style={{ border: '1px solid #d1d5db' }}>
              <p className="text-sm font-bold" style={{ color: '#000000' }}>{profile.format}</p>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{profile.desc}</p>
              <p className="text-xs mt-2 font-mono" style={{ color: '#000000' }}>Peso: {profile.weight}</p>
              <a href="/admin/pricing" className="text-xs mt-2 inline-block" style={{ color: '#3b82f6' }}>
                Configurar precios →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
