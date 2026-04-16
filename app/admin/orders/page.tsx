import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'
import Link                  from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  created:    { label: 'CREADO',      color: '#6b7280', bg: '#f3f4f6' },
  processing: { label: 'PROCESANDO',  color: '#d97706', bg: '#fffbeb' },
  paid:       { label: 'PAGADO',      color: '#059669', bg: '#ecfdf5' },
  shipped:    { label: 'ENVIADO',     color: '#2563eb', bg: '#eff6ff' },
  delivered:  { label: 'ENTREGADO',   color: '#16a34a', bg: '#f0fdf4' },
  collected:  { label: 'RECOGIDO',    color: '#16a34a', bg: '#f0fdf4' },
  cancelled:  { label: 'CANCELADO',   color: '#dc2626', bg: '#fef2f2' },
  pending:    { label: 'PENDIENTE',   color: '#d97706', bg: '#fffbeb' },
}

export default async function OrdersPage() {
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: orders, error } = await admin
    .from('orders')
    .select('id, order_number, user_id, total, status, payment_status, shipping_method, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-sm" style={{ color: '#ef4444' }}>Error al cargar pedidos: {error.message}</p>
          <p className="text-xs mt-2" style={{ color: '#6b7280' }}>Verifica que la tabla "orders" existe en Supabase.</p>
        </div>
      </div>
    )
  }

  const orderList = orders ?? []
  const totalRevenue = orderList
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0)
  const paidCount = orderList.filter(o => o.payment_status === 'paid').length
  const pendingCount = orderList.filter(o => o.payment_status === 'pending').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>PEDIDOS</h1>
        <div className="flex gap-4 text-xs" style={{ color: '#6b7280' }}>
          <span>{orderList.length} pedidos</span>
          <span style={{ color: '#16a34a' }}>{paidCount} pagados</span>
          <span style={{ color: '#d97706' }}>{pendingCount} pendientes</span>
          <span>Ingresos: {totalRevenue.toFixed(2)} €</span>
        </div>
      </div>

      {orderList.length === 0 ? (
        <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>No hay pedidos todavía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '2px solid #000000' }}>
                {['PEDIDO', 'FECHA', 'MÉTODO', 'ESTADO PAGO', 'ESTADO', 'TOTAL', ''].map((h, i) => (
                  <th key={i} className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderList.map(order => {
                const paymentSt = STATUS[order.payment_status ?? 'pending'] ?? STATUS.pending
                const orderSt = STATUS[order.status ?? 'created'] ?? STATUS.created
                return (
                  <tr key={order.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="px-3 py-3">
                      <p className="text-sm font-bold" style={{ color: '#000000' }}>
                        {order.order_number || order.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>
                      {new Date(order.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#374151' }}>
                      {order.shipping_method === 'click_collect' ? 'GUARDI' :
                       order.shipping_method === 'home_delivery' ? 'ENVÍO' :
                       order.shipping_method ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{ color: paymentSt.color, border: `1px solid ${paymentSt.color}`, backgroundColor: paymentSt.bg }}>
                        {paymentSt.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{ color: orderSt.color, border: `1px solid ${orderSt.color}`, backgroundColor: orderSt.bg }}>
                        {orderSt.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                      {Number(order.total).toFixed(2)} €
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/order/${order.id}`}
                        className="text-xs px-3 py-1 hover:bg-black hover:text-white transition-colors"
                        style={{ border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none' }}>
                        VER
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
