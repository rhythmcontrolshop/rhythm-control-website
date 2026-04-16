import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'

export const dynamic = 'force-dynamic'

interface CustomerRow {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  city: string | null
  country: string | null
  address: string | null
  postal_code: string | null
  created_at: string
  order_count: number
  total_spent: number
}

export default async function ClientesPage() {
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  // Get all profiles with order stats
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, username, first_name, last_name, phone, city, country, address, postal_code, created_at')
    .order('created_at', { ascending: false })

  // Get order stats per user
  const { data: orderStats } = await admin
    .from('orders')
    .select('user_id, total')
    .eq('payment_status', 'paid')

  const statsMap = new Map<string, { count: number; total: number }>()
  ;(orderStats ?? []).forEach((o: any) => {
    if (!o.user_id) return
    const existing = statsMap.get(o.user_id) ?? { count: 0, total: 0 }
    existing.count++
    existing.total += Number(o.total)
    statsMap.set(o.user_id, existing)
  })

  const customers: CustomerRow[] = (profiles ?? []).map((p: any) => {
    const stats = statsMap.get(p.id) ?? { count: 0, total: 0 }
    return { ...p, order_count: stats.count, total_spent: stats.total }
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>CLIENTES</h1>
        <p className="text-xs" style={{ color: '#6b7280' }}>{customers.length} registrados</p>
      </div>

      {customers.length === 0 ? (
        <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>No hay clientes registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '2px solid #000000' }}>
                {['CLIENTE', 'EMAIL', 'TELÉFONO', 'DIRECCIÓN', 'CIUDAD', 'PEDIDOS', 'TOTAL GASTADO', 'REGISTRADO'].map((h, i) => (
                  <th key={i} className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="px-3 py-3">
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>
                      {c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : c.username || '—'}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>{c.email}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>{c.phone || '—'}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {c.address ? `${c.address}${c.postal_code ? `, ${c.postal_code}` : ''}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>
                    {c.city ? `${c.city}${c.country ? `, ${c.country}` : ''}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>{c.order_count}</td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                    {c.total_spent.toFixed(2)} €
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {new Date(c.created_at).toLocaleDateString('es-ES')}
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
