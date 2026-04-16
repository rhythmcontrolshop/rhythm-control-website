import Link           from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import SyncStatus     from '@/components/admin/SyncStatus'
import SeedButton     from '@/components/admin/SeedButton'
import type { SyncJob } from '@/types'

export const dynamic = 'force-dynamic'

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
      <h1 className="text-2xl font-bold mb-10" style={{ color: '#000000' }}>DASHBOARD</h1>

      {/* ── INVENTARIO ── */}
      <section className="mb-10">
        <p className="text-xs font-medium mb-5 tracking-widest" style={{ color: '#000000' }}>INVENTARIO</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InventoryButton href="/admin/inventory?filter=active" label="EN VENTA" count={active} />
          <InventoryButton href="/admin/inventory?filter=sold" label="VENDIDOS" count={sold} />
          <InventoryButton href="/admin/reservations" label="GUARDI" count={reserved} />
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      {/* ── PEDIDOS ── */}
      <section className="mb-10">
        <p className="text-xs font-medium mb-5 tracking-widest" style={{ color: '#000000' }}>PEDIDOS</p>
        <Link
          href="/admin/orders"
          className="flex items-center justify-between w-full sm:w-auto px-8 py-5 transition-all duration-200 hover:bg-black hover:text-white group"
          style={{
            border: '2px solid #000000',
            backgroundColor: '#FFFFFF',
            color: '#000000',
            textDecoration: 'none',
          }}
        >
          <span className="text-lg font-bold tracking-widest">PEDIDOS</span>
          <span className="ml-6 text-3xl font-bold tabular-nums">→</span>
        </Link>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      {/* ── SYNC STATUS ── */}
      <section className="mb-10">
        <SyncStatus lastJob={lastJob} />
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      {/* ── SEED ── */}
      <section className="mb-10">
        <SeedButton />
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      {/* ── ACCIONES RÁPIDAS ── */}
      <section>
        <p className="text-xs font-medium mb-5 tracking-widest" style={{ color: '#000000' }}>ACCIONES RÁPIDAS</p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
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

/* ────────────────────────────────────────────
   Large inventory navigation button
   ──────────────────────────────────────────── */
function InventoryButton({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-8 transition-all duration-200 hover:bg-black hover:text-white group"
      style={{
        border: '2px solid #000000',
        backgroundColor: '#FFFFFF',
        color: '#000000',
        textDecoration: 'none',
        minHeight: '140px',
      }}
    >
      <span className="text-xs font-medium tracking-widest mb-3 opacity-70 group-hover:opacity-100">
        {label}
      </span>
      <span className="text-5xl font-bold tabular-nums">{count}</span>
    </Link>
  )
}

/* ────────────────────────────────────────────
   Small quick-action link
   ──────────────────────────────────────────── */
function QuickLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      className="text-xs px-6 py-3 text-center tracking-widest font-medium transition-all duration-200 hover:bg-black hover:text-white hover:border-black"
      style={{
        border: '1px solid #d1d5db',
        color: '#374151',
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  )
}
