import Link           from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import SyncStatus     from '@/components/admin/SyncStatus'
import SeedButton     from '@/components/admin/SeedButton'
import type { SyncJob } from '@/types'

async function getStats() {
  const supabase = createAdminClient()
  const [activeRes, soldRes, reservedRes, lastJobRes] = await Promise.all([
    supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'reserved'),
    supabase.from('sync_jobs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  return { active: activeRes.count ?? 0, sold: soldRes.count ?? 0, reserved: reservedRes.count ?? 0, lastJob: lastJobRes.data as SyncJob | null }
}

export default async function AdminDashboard() {
  const { active, sold, reserved, lastJob } = await getStats()
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#000000' }}>DASHBOARD</h1>

      <section className="mb-10">
        <p className="text-xs font-medium mb-4" style={{ color: '#000000' }}>INVENTARIO</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin/inventory?filter=active">
            <StatCard label="En venta" value={active} accent />
          </Link>
          <Link href="/admin/inventory?filter=sold">
            <StatCard label="Vendidos" value={sold} />
          </Link>
          <Link href="/admin/reservations">
            <StatCard label="Reservados (GUARDI)" value={reserved} />
          </Link>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      <section className="mb-10">
        <SyncStatus lastJob={lastJob} />
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      <section className="mb-10">
        <SeedButton />
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      <section>
        <p className="text-xs font-medium mb-4" style={{ color: '#000000' }}>ACCIONES RÁPIDAS</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <QuickLink href="/admin/inventory" label="VER INVENTARIO" />
          <QuickLink href="/admin/reservations" label="GESTIONAR GUARDI" />
          <QuickLink href="/admin/scan" label="ESCANEAR DISCO" />
          <QuickLink href="/admin/events" label="GESTIONAR AGENDA" />
          <QuickLink href="/admin/orders" label="VER PEDIDOS" />
          <QuickLink href="/" label="VER TIENDA →" external />
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="p-5 transition-colors hover:bg-gray-50" style={{ border: '1px solid #e5e7eb', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
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
