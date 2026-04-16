import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'
import ShippingActions       from './ShippingActions'

export const dynamic = 'force-dynamic'

interface ShippingRateRow {
  id: string
  name: string
  description: string | null
  zone: string
  method: string
  carrier: string | null
  min_weight_kg: number
  max_weight_kg: number
  price: number
  free_above: number | null
  is_active: boolean
  sort_order: number
}

const METHOD_LABELS: Record<string, string> = {
  home_delivery: 'Domicilio',
  post_office: 'Oficina de correos',
  click_collect: 'Click & Collect',
}

const ZONE_LABELS: Record<string, string> = {
  es_peninsula: 'España Península',
  es_baleares: 'Baleares',
  es_canarias: 'Canarias',
  es_barcelona: 'Barcelona',
  pt: 'Portugal',
  eu: 'UE',
  international: 'Internacional',
}

export default async function ShippingPage() {
  // Verificar autenticación
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) redirect('/admin/login')

  const supabase = createAdminClient()

  let rates: ShippingRateRow[] | null = null
  let fetchError: string | null = null

  try {
    const { data, error } = await supabase
      .from('shipping_rates')
      .select('*')
      .order('sort_order')

    if (error) {
      console.error('Shipping rates fetch error:', error)
      fetchError = error.message
    } else {
      rates = data as ShippingRateRow[]
    }
  } catch (err) {
    console.error('Shipping page crash:', err)
    fetchError = err instanceof Error ? err.message : 'Error desconocido'
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>TARIFAS DE ENVÍO</h1>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          {rates?.length ?? 0} tarifas configuradas
        </p>
      </div>

      {fetchError && (
        <div className="p-4 mb-6" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-sm" style={{ color: '#ef4444' }}>Error al cargar tarifas: {fetchError}</p>
          <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
            Verifica que la tabla "shipping_rates" existe en Supabase y que las variables de entorno están configuradas.
          </p>
        </div>
      )}

      {rates && rates.length === 0 && !fetchError && (
        <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-sm" style={{ color: '#6b7280' }}>No hay tarifas configuradas. Añade la primera desde el formulario.</p>
        </div>
      )}

      {rates && rates.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '2px solid #000000' }}>
                {['NOMBRE', 'ZONA', 'MÉTODO', 'TRANSPORTISTA', 'PESO (kg)', 'PRECIO', 'GRATIS DESDE', 'ESTADO', ''].map((h, i) => (
                  <th key={i} className="text-xs font-medium px-3 py-3"
                    style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rates.map(rate => (
                <tr key={rate.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="px-3 py-3">
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>{rate.name}</p>
                    {rate.description && (
                      <p className="text-xs" style={{ color: '#6b7280' }}>{rate.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>
                    {ZONE_LABELS[rate.zone] || rate.zone}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>
                    {METHOD_LABELS[rate.method] || rate.method}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {rate.carrier || '—'}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>
                    {rate.min_weight_kg} - {rate.max_weight_kg}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                    {rate.price.toFixed(2)} €
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {rate.free_above ? `${rate.free_above.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-1"
                      style={{
                        color: rate.is_active ? '#22c55e' : '#9ca3af',
                        border: `1px solid ${rate.is_active ? '#22c55e' : '#9ca3af'}`,
                      }}>
                      {rate.is_active ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <ShippingActions rateId={rate.id} isActive={rate.is_active} currentPrice={rate.price} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
