import { createAdminClient } from '@/lib/supabase/admin'
import PricingActions from './PricingActions'

export const dynamic = 'force-dynamic'

interface PriceChannelRow {
  id: string
  slug: string
  name: string
  coefficient: number
  is_active: boolean
  sort_order: number
  updated_at: string
}

export default async function PricingPage() {
  const supabase = createAdminClient()
  const { data: channels } = await supabase
    .from('price_channels')
    .select('*')
    .order('sort_order')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>COEFICIENTES DE PRECIO</h1>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          Ajusta el multiplicador por canal sobre el precio base
        </p>
      </div>

      <div className="mb-6 p-4" style={{ border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <p className="text-xs mb-2" style={{ color: '#6b7280' }}>
          PRECIO BASE = precio del disco en Discogs Marketplace
        </p>
        <p className="text-xs mb-2" style={{ color: '#6b7280' }}>
          PRECIO CANAL = precio base × coeficiente del canal
        </p>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          IVA superreducido 4% se aplica en checkout sobre el precio del canal
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '2px solid #000000' }}>
              {['CANAL', 'SLUG', 'COEFICIENTE', 'EJEMPLO (20€ base)', 'ESTADO', ''].map((h, i) => (
                <th key={i} className="text-xs font-medium px-3 py-3"
                  style={{ color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(channels as PriceChannelRow[])?.map(ch => {
              const example = (20 * ch.coefficient).toFixed(2)
              return (
                <tr key={ch.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="px-3 py-3">
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>{ch.name}</p>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono" style={{ color: '#6b7280' }}>
                    {ch.slug}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-lg font-bold" style={{ color: '#000000' }}>
                      ×{ch.coefficient.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                    {example} €
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-1"
                      style={{
                        color: ch.is_active ? '#22c55e' : '#9ca3af',
                        border: `1px solid ${ch.is_active ? '#22c55e' : '#9ca3af'}`,
                      }}>
                      {ch.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <PricingActions
                      channelId={ch.id}
                      currentCoefficient={ch.coefficient}
                      currentName={ch.name}
                      isActive={ch.is_active}
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
