import Link           from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import SyncStatus     from '@/components/admin/SyncStatus'
import SeedButton     from '@/components/admin/SeedButton'
import AdminInteractiveTools from '@/components/admin/AdminInteractiveTools'
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
      <h1 className="font-display text-3xl mb-8" style={{ color: 'var(--rc-color-text)' }}>DASHBOARD</h1>
      <section className="mb-10">
        <p className="font-meta text-xs mb-4" style={{ color: 'var(--rc-color-muted)' }}>INVENTARIO REAL</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="En venta"   value={active}   accent />
          <StatCard label="Vendidos"   value={sold}   />
          <StatCard label="Reservados" value={reserved} />
        </div>
      </section>
      <hr className="separator mb-10" />
      <section className="mb-10">
        <p className="font-meta text-xs mb-4" style={{ color: 'var(--rc-color-muted)' }}>SINCRONIZACIÓN DISCOGS</p>
        <SyncStatus lastJob={lastJob} />
      </section>
      <hr className="separator mb-10" />
      <section className="mb-10"><SeedButton /></section>
      <AdminInteractiveTools />
      <hr className="separator mb-10" />
      <section>
        <p className="font-meta text-xs mb-4" style={{ color: 'var(--rc-color-muted)' }}>ACCIONES RÁPIDAS</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <QuickLink href="/admin/scan" label="ESCANEAR DISCO" />
          <QuickLink href="/admin/agenda" label="GESTIONAR AGENDA" />
          <QuickLink href="/admin/order/RC-00235" label="VER PEDIDO EJEMPLO" />
          <QuickLink href="/" label="VER TIENDA →" external />
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="p-5" style={{ border: 'var(--rc-border-main)' }}>
      <p className="font-meta text-xs mb-3" style={{ color: 'var(--rc-color-muted)' }}>{label.toUpperCase()}</p>
      <p className="font-display text-4xl" style={{ color: accent ? 'var(--rc-color-accent)' : 'var(--rc-color-text)' }}>{value}</p>
    </div>
  )
}

function QuickLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <Link href={href} target={external ? '_blank' : undefined} className="font-display text-xs px-5 py-3 text-center transition-colors hover:bg-white hover:text-black" style={{ border: 'var(--rc-border-main)', color: 'var(--rc-color-text)' }}>
      {label}
    </Link>
  )
}
