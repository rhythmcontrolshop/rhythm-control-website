import { createAdminClient } from '@/lib/supabase/admin'
import InventoryActions      from './InventoryActions'
export const dynamic = 'force-dynamic'
const STATUS: Record<string, { label: string; color: string }> = {
  active:   { label: 'ACTIVO',    color: '#22c55e' },
  reserved: { label: 'RESERVADO', color: '#f59e0b' },
  sold:     { label: 'VENDIDO',   color: '#ef4444' },
  gifted:   { label: 'REGALADO',  color: '#8b5cf6' },
}
export default async function InventoryPage() {
  const { data: releases } = await createAdminClient()
    .from('releases').select('id, title, artists, condition, price, status, thumb')
    .order('created_at', { ascending: false })
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: 'var(--rc-border-main)', paddingBottom: '1rem' }}>
        <h1 className="font-display text-xl" style={{ color: 'var(--rc-color-text)' }}>INVENTARIO</h1>
        <p className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>{releases?.length ?? 0} registros</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
              {['', 'ARTISTA / TÍTULO', 'COND.', 'PRECIO', 'ESTADO', ''].map((h, i) => (
                <th key={i} className="font-meta text-xs text-left px-3 py-3"
                  style={{ color: 'var(--rc-color-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {releases?.map(r => {
              const st = STATUS[r.status ?? 'active'] ?? STATUS.active
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #111' }}>
                  <td className="px-3 py-3 w-12">
                    {r.thumb
                      ? <img src={r.thumb} alt="" className="w-10 h-10 object-cover" style={{ border: '1px solid #333' }} />
                      : <div className="w-10 h-10" style={{ backgroundColor: '#111', border: '1px solid #333' }} />}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-display text-sm" style={{ color: 'var(--rc-color-text)' }}>{r.artists[0] ?? '—'}</p>
                    <p className="font-meta text-xs"    style={{ color: 'var(--rc-color-muted)' }}>{r.title}</p>
                  </td>
                  <td className="px-3 py-3 font-meta text-sm" style={{ color: 'var(--rc-color-text)' }}>{r.condition ?? '—'}</td>
                  <td className="px-3 py-3 font-display text-sm" style={{ color: 'var(--rc-color-text)' }}>
                    {r.price?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-meta text-xs px-2 py-1"
                      style={{ color: st.color, border: `1px solid ${st.color}`, backgroundColor: st.color + '15' }}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <InventoryActions releaseId={r.id} currentStatus={r.status ?? 'active'} />
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
