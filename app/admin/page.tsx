export const dynamic = 'force-dynamic'
import Link           from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import SyncStatus     from '@/components/admin/SyncStatus'
import SeedButton     from '@/components/admin/SeedButton'
import type { SyncJob } from '@/types'


async function getStats() {
  const supabase = createAdminClient()
  const [activeRes, soldRes, reservedRes, lastJobRes, ordersTodayRes, revenueRes] = await Promise.all([
    supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'reserved'),
    supabase.from('sync_jobs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().slice(0, 10)),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
  ])

  const totalRevenue = (revenueRes.data ?? []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)

  return {
    active: activeRes.count ?? 0,
    sold: soldRes.count ?? 0,
    reserved: reservedRes.count ?? 0,
    lastJob: lastJobRes.data as SyncJob | null,
    ordersToday: ordersTodayRes.count ?? 0,
    totalRevenue,
  }
}

export default async function AdminDashboard() {
  const { active, sold, reserved, lastJob, ordersToday, totalRevenue } = await getStats()
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#000000' }}>DASHBOARD</h1>

      <section className="mb-10">
        <p className="text-xs font-medium mb-4" style={{ color: '#000000' }}>INVENTARIO</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="En venta"   value={active}   accent />
          <StatCard label="Vendidos"   value={sold}   />
          <StatCard label="Guardi" value={reserved} />
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      <section className="mb-10">
        <p className="text-xs font-medium mb-4" style={{ color: '#000000' }}>PEDIDOS</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Hoy" value={ordersToday} accent />
          <StatCard label="Revenue total" value={`${(totalRevenue / 100).toFixed(2)} EUR`} />
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      <section className="mb-10">
        <p className="text-xs font-medium mb-4" style={{ color: '#000000' }}>SINCRONIZACIÓN DISCOGS</p>
        <SyncStatus lastJob={lastJob} />
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      <section className="mb-10">
        <SeedButton />
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      <section>
        <p className="text-xs font-medium mb-4" style={{ color: '#000000' }}>ACCIONES RÁPIDAS</p>
        <div className="flex flex-wrap gap-3">
          <QuickLink href="/admin/inventory" label="VER INVENTARIO" />
          <QuickLink href="/admin/pedidos" label="PEDIDOS" />
          <QuickLink href="/admin/guardi" label="GUARDI" />
          <QuickLink href="/admin/codigos" label="CODIGOS" />
          <QuickLink href="/admin/clientes" label="CLIENTES" />
          <QuickLink href="/admin/discogs" label="DISCOGS" />
          <QuickLink href="/admin/shipping" label="ENVIOS" />
          <QuickLink href="/admin/agenda" label="AGENDA" />
          <QuickLink href="/" label="VER TIENDA →" external />
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="p-5" style={{ border: '1px solid #e5e7eb', backgroundColor: '#FFFFFF' }}>
      <p className="text-xs font-medium mb-3" style={{ color: '#6b7280' }}>{label.toUpperCase()}</p>
      <p className="text-4xl font-bold" style={{ color: accent ? '#000000' : '#374151' }}>{value}</p>
    </div>
  )
}

function QuickLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <Link href={href} target={external ? '_blank' : undefined}
      className="text-xs px-5 py-3 text-center transition-colors hover:bg-black hover:text-white"
      style={{ border: '1px solid #d1d5db', color: '#374151' }}>
      {label}
    </Link>
  )
}
