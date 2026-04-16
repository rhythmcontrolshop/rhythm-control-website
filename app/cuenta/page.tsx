import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

      {/* ACCESOS RÁPIDOS — moved above bienvenido, serves as primary nav */}
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

      {/* BIENVENIDO */}
      <div className="mb-10">
        <p className="font-meta text-xs mb-2" style={{ color: '#FFFFFF' }}>BIENVENIDO</p>
        <h1 className="font-display text-3xl" style={{ color: '#FFFFFF' }}>
          {profile?.username || profile?.email?.split('@')[0] || 'USUARIO'}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <StatCard label="PEDIDOS" value={ordersList.length} href="/cuenta/pedidos" />
        <StatCard label="FAVORITOS" value={favoritesCount ?? 0} href="/cuenta/favoritos" />
      </div>

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
              <Link key={order.id} href="/cuenta/pedidos" className="block">
                <div className="flex items-center justify-between p-4 transition-colors duration-200"
                  style={{ border: '2px solid #FFFFFF' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a1a1a' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <div>
                    <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{order.order_number || order.id.slice(0, 8)}</p>
                    <p className="font-meta text-xs" style={{ color: '#999' }}>{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{Number(order.total).toFixed(2)} €</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="block p-4 transition-colors duration-200"
      style={{ border: '2px solid #FFFFFF', textDecoration: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a1a1a' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
      <p className="font-meta text-xs mb-2" style={{ color: '#FFFFFF' }}>{label}</p>
      <p className="font-display text-2xl" style={{ color: '#F0E040' }}>{value}</p>
    </Link>
  )
}

function QuickLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <Link href={href} target={external ? '_blank' : undefined}
      className="font-display text-xs px-5 py-3 text-center tracking-widest transition-colors duration-200"
      style={{
        border: '2px solid #000000',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}>
      {label}
    </Link>
  )
}
