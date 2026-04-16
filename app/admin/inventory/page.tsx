import { createAdminClient } from '@/lib/supabase/admin'
import InventoryActions from './InventoryActions'
export const dynamic = 'force-dynamic'

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
}

export default async function InventoryPage() {
  const supabase = createAdminClient()
  const { data: releases } = await supabase
    .from('releases')
    .select('id, title, artists, condition, price, status, thumb, quantity, barcode, location, discogs_listing_id')
    .order('created_at', { ascending: false })

  // Estadísticas rápidas
  const total = releases?.length ?? 0
  const active = releases?.filter((r: ReleaseRow) => r.status === 'active').length ?? 0
  const withBarcode = releases?.filter((r: ReleaseRow) => r.barcode).length ?? 0
  const totalUnits = releases?.reduce((sum: number, r: ReleaseRow) => sum + (r.quantity || 1), 0) ?? 0

  return (
    <div className="p-6">
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
              {['', 'ARTISTA / TÍTULO', 'COND.', 'UDS.', 'PRECIO', 'BARCODE', 'UBICACIÓN', 'ESTADO', ''].map((h, i) => (
                <th key={i} className="text-xs font-medium px-3 py-3"
                  style={{ color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(releases as ReleaseRow[])?.map(r => {
              const st = STATUS[r.status ?? 'active'] ?? STATUS.active
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
                  </td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#000000' }}>{r.condition ?? '—'}</td>
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
