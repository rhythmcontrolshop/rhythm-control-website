import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { OrderRow } from './CuentaComponents'

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

  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const ordersList = orders ?? []
  const displayName = profile?.username || profile?.email?.split('@')[0] || 'USUARIO'

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      {/* Welcome — only on mobile since sidebar shows it on desktop */}
      <div className="md:hidden mb-8">
        <p className="font-meta text-xs mb-1" style={{ color: '#999' }}>BIENVENIDO</p>
        <h1 className="font-display text-2xl" style={{ color: '#F0E040' }}>{displayName}</h1>
      </div>

      {/* Stats row — compact, no cards */}
      <div className="flex gap-6 mb-10">
        <div>
          <p className="font-meta text-[0.6rem]" style={{ color: '#999' }}>PEDIDOS</p>
          <p className="font-display text-2xl" style={{ color: '#FFFFFF' }}>{ordersCount ?? 0}</p>
        </div>
        <div>
          <p className="font-meta text-[0.6rem]" style={{ color: '#999' }}>FAVORITOS</p>
          <p className="font-display text-2xl" style={{ color: '#FFFFFF' }}>{favoritesCount ?? 0}</p>
        </div>
      </div>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>PEDIDOS RECIENTES</p>
          <Link href="/cuenta/pedidos" className="font-meta text-xs underline" style={{ color: '#F0E040' }}>Ver todos →</Link>
        </div>
        {ordersList.length === 0 ? (
          <p className="font-meta text-xs" style={{ color: '#999' }}>No tienes pedidos todavía.</p>
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
