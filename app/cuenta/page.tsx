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

  // Pedidos reales
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const ordersList = orders ?? []

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

      {/* Stats — sin Ciudad/País */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <StatCard label="PEDIDOS" value={ordersList.length} href="/cuenta/pedidos" />
        <StatCard label="FAVORITOS" value={favoritesCount ?? 0} href="/cuenta/favoritos" />
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

        {ordersList.length === 0 ? (
          <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>No tienes pedidos todavía.</p>
        ) : (
          <div className="space-y-2">
            {ordersList.map((order: any) => (
              <Link key={order.id} href="/cuenta/pedidos" className="block">
                <div className="flex items-center justify-between p-4" style={{ border: '2px solid #FFFFFF' }}>
                  <div>
                    <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{order.order_number || order.id.slice(0, 8)}</p>
                    <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
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

      <hr className="separator mb-10" />

      {/* Acciones */}
      <section>
        <p className="font-meta text-xs mb-4" style={{ color: '#FFFFFF' }}>ACCESOS RÁPIDOS</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <QuickLink href="/cuenta/pedidos" label="MIS PEDIDOS" />
          <QuickLink href="/cuenta/favoritos" label="MIS FAVORITOS" />
          <QuickLink href="/cuenta/datos" label="MIS DATOS" />
          <QuickLink href="/" label="IR A LA TIENDA" external />
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="block p-4 transition-colors hover:bg-white"
      style={{ border: '2px solid #FFFFFF' }}>
      <p className="font-meta text-xs mb-2" style={{ color: '#FFFFFF' }}>{label}</p>
      <p className="font-display text-2xl" style={{ color: '#F0E040' }}>{value}</p>
    </Link>
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
