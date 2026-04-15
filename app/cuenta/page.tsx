export const dynamic = 'force-dynamic'
// app/cuenta/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Contar favoritos
  const { count: favoritesCount } = await supabase
    .from('wantlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  // Pedidos (mock por ahora)
  const recentOrders = [
    { id: 'RC-001', date: '2026-04-12', total: 85.00, status: 'Entregado' },
    { id: 'RC-002', date: '2026-04-10', total: 120.00, status: 'En tránsito' },
  ]

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-10">
        <p className="font-meta text-xs mb-2" style={{ color: '#FFFFFF' }}>
          BIENVENIDO
        </p>
        <h1 className="font-display text-3xl" style={{ color: '#FFFFFF' }}>
          {profile?.username || profile?.email?.split('@')[0] || 'USUARIO'}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="PEDIDOS" value={recentOrders.length} />
        <StatCard label="FAVORITOS" value={favoritesCount ?? 0} />
        <StatCard label="CIUDAD" value={profile?.city || '—'} />
        <StatCard label="PAÍS" value={profile?.country || '—'} />
      </div>

      <hr className="separator mb-10" />

      {/* Pedidos recientes */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>PEDIDOS RECIENTES</p>
          <Link href="/cuenta/pedidos" className="font-meta text-xs underline" style={{ color: '#FFFFFF' }}>
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>No tienes pedidos todavía.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4" style={{ border: '2px solid #FFFFFF' }}>
                <div>
                  <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{order.id}</p>
                  <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{order.total.toFixed(2)} €</p>
                  <p className="font-meta text-xs" style={{ color: '#F0E040' }}>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="separator mb-10" />

      {/* Acciones */}
      <section>
        <p className="font-meta text-xs mb-4" style={{ color: '#FFFFFF' }}>ACCESOS RÁPIDOS</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <QuickLink href="/cuenta/favoritos" label="MI LISTA DE FAVORITOS" />
          <QuickLink href="/" label="IR A LA TIENDA" external />
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4" style={{ border: '2px solid #FFFFFF' }}>
      <p className="font-meta text-xs mb-2" style={{ color: '#FFFFFF' }}>{label}</p>
      <p className="font-display text-2xl" style={{ color: '#F0E040' }}>{value}</p>
    </div>
  )
}

function QuickLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <Link href={href} target={external ? '_blank' : undefined}
      className="font-display text-xs px-5 py-3 text-center transition-colors hover:bg-white hover:text-black"
      style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}>
      {label}
    </Link>
  )
}
