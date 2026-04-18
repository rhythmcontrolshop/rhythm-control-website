import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatCard, QuickLink, OrderRow } from './CuentaComponents'

export default async function CuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { count: favoritesCount } = await supabase
    .from('wantlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const ordersList = orders ?? []

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">

      <section className="mb-10">
        <div className="mb-4">
          <p className="font-meta text-xs mb-2" style={{ color: '#FFFFFF' }}>BIENVENIDO</p>
          <h1 className="font-display text-3xl" style={{ color: '#FFFFFF' }}>
            {profile?.username || profile?.email?.split('@')[0] || 'USUARIO'}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="PEDIDOS" value={ordersList.length} href="/cuenta/pedidos" />
          <StatCard label="FAVORITOS" value={favoritesCount ?? 0} href="/cuenta/favoritos" />
        </div>
      </section>

      <hr className="mb-10" style={{ border: 'none', borderTop: '1px solid #333' }} />

      <section className="mb-10">
        <p className="font-meta text-xs mb-4" style={{ color: '#FFFFFF' }}>ACCESOS RÁPIDOS</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <QuickLink href="/cuenta/pedidos" label="MIS PEDIDOS" />
          <QuickLink href="/cuenta/favoritos" label="MIS FAVORITOS" />
          <QuickLink href="/cuenta/datos" label="MIS DATOS" />
          <QuickLink href="/stock" label="IR A LA TIENDA" external />
        </div>
      </section>

      <hr className="mb-10" style={{ border: 'none', borderTop: '1px solid #333' }} />

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>PEDIDOS RECIENTES</p>
          <Link href="/cuenta/pedidos" className="font-meta text-xs underline" style={{ color: '#FFFFFF' }}>Ver todos →</Link>
        </div>
        {ordersList.length === 0 ? (
          <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>No tienes pedidos todavía.</p>
        ) : (
          <div className="space-y-2">
            {ordersList.map((order: any) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
