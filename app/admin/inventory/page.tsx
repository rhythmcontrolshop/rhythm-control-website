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
}

type SortField = 'artist' | 'title' | 'price' | 'condition' | 'year' | 'status'
type SortDir = 'asc' | 'desc'

export default function InventoryPage() {
  const [releases, setReleases] = useState<ReleaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('artist')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [error, setError] = useState<string | null>(null)

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

  const sorted = [...releases].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'artist': cmp = (a.artists?.[0] ?? '').localeCompare(b.artists?.[0] ?? ''); break
      case 'title': cmp = a.title.localeCompare(b.title); break
      case 'price': cmp = a.price - b.price; break
      case 'condition': cmp = (a.condition ?? '').localeCompare(b.condition ?? ''); break
      case 'year': cmp = (a.year ?? 0) - (b.year ?? 0); break
      case 'status': cmp = (a.status ?? '').localeCompare(b.status ?? ''); break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const total = releases.length
  const active = releases.filter(r => r.status === 'active').length
  const withBarcode = releases.filter(r => r.barcode).length
  const totalUnits = releases.reduce((sum, r) => sum + (r.quantity || 1), 0)

  function SortArrow({ field }: { field: SortField }) {
    if (sortField !== field) return <span style={{ marginLeft: 4, opacity: 0.3 }}>↕</span>
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
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

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '2px solid #000000' }}>
              <th className="text-xs font-medium px-3 py-3 w-12" style={{ color: '#6b7280' }}></th>
              {([
                ['artist', 'ARTISTA'],
                ['title', 'TÍTULO'],
                ['condition', 'COND.'],
                ['year', 'AÑO'],
                ['price', 'PRECIO'],
              ] as [SortField, string][]).map(([field, label]) => (
                <th key={field} className="text-xs font-medium px-3 py-3 cursor-pointer select-none hover:text-black"
                  style={{ color: '#6b7280' }}
                  onClick={() => toggleSort(field)}>
                  {label}<SortArrow field={field} />
                </th>
              ))}
              <th className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>BARCODE</th>
              <th className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>UBICACIÓN</th>
              {([['status', 'ESTADO']] as [SortField, string][]).map(([field, label]) => (
                <th key={field} className="text-xs font-medium px-3 py-3 cursor-pointer select-none hover:text-black"
                  style={{ color: '#6b7280' }}
                  onClick={() => toggleSort(field)}>
                  {label}<SortArrow field={field} />
                </th>
              ))}
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
                  <td className="px-3 py-3 text-sm" style={{ color: '#000000' }}>{r.year ?? '—'}</td>
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
    </div>
  )
}
