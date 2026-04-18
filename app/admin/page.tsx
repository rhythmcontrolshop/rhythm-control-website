import Link           from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import SyncStatus     from '@/components/admin/SyncStatus'
import SeedButton     from '@/components/admin/SeedButton'
import type { SyncJob } from '@/types'

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().slice(0, 10)

    const [activeRes, soldRes, reservedRes, ordersRes, todayOrdersRes, lastJobRes] = await Promise.all([
      supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
      supabase.from('releases').select('*', { count: 'exact', head: true }).eq('status', 'reserved'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('sync_jobs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    return {
      active: activeRes.count ?? 0,
      sold: soldRes.count ?? 0,
      reserved: reservedRes.count ?? 0,
      totalOrders: ordersRes.count ?? 0,
      todayOrders: todayOrdersRes.count ?? 0,
      lastJob: (lastJobRes.data as SyncJob | null) ?? null,
      error: null as string | null,
    }
  } catch (err: any) {
    return {
      active: 0, sold: 0, reserved: 0,
      totalOrders: 0, todayOrders: 0,
      lastJob: null,
      error: err?.message || 'Error de conexión con la base de datos',
    }
  }
}

export default async function AdminDashboard() {
  const { active, sold, reserved, totalOrders, todayOrders, lastJob, error } = await getStats()

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-10" style={{ color: '#000000' }}>DASHBOARD</h1>

      {error && (
        <div className="mb-8 p-4" style={{ border: '2px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-sm font-medium" style={{ color: '#ef4444' }}>ERROR: {error}</p>
          <p className="text-xs mt-1" style={{ color: '#999' }}>Verifica las variables de entorno SUPABASE_SERVICE_ROLE_KEY en Vercel.</p>
        </div>
      )}

      <section className="mb-10">
        <p className="text-xs font-medium mb-5 tracking-widest" style={{ color: '#000000' }}>INVENTARIO</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InventoryButton href="/admin/inventory?filter=active" label="EN VENTA" count={active} />
          <InventoryButton href="/admin/inventory?filter=sold" label="VENDIDOS" count={sold} />
          <InventoryButton href="/admin/reservations" label="GUARDI" count={reserved} />
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      <section className="mb-10">
        <p className="text-xs font-medium mb-5 tracking-widest" style={{ color: '#000000' }}>PEDIDOS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InventoryButton href="/admin/pedidos" label="HOY" count={todayOrders} />
          <InventoryButton href="/admin/pedidos" label="TOTAL" count={totalOrders} />
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
        <p className="text-xs font-medium mb-5 tracking-widest" style={{ color: '#000000' }}>ACCIONES RÁPIDAS</p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <QuickLink href="/admin/inventory" label="VER INVENTARIO" />
          <QuickLink href="/admin/guardi" label="GESTIONAR GUARDI" />
          <QuickLink href="/admin/scan" label="ESCANEAR DISCO" />
          <QuickLink href="/admin/events" label="GESTIONAR AGENDA" />
          <QuickLink href="/admin/pedidos" label="VER PEDIDOS" />
          <QuickLink href="/admin/codigos" label="CÓDIGOS / ETIQUETAS" />
          <QuickLink href="/" label="VER TIENDA →" external />
        </div>
      </section>
    </div>
  )
}

function InventoryButton({ href, label, count }: { href: string; label: string; count: number }) {
  // E3-16: CSS hover instead of onMouseEnter/onMouseLeave
  return (
    <Link href={href}
      className="flex flex-col items-center justify-center p-8 transition-colors duration-200 hover:bg-black hover:text-white hover:border-white"
      style={{ border: '2px solid #000000', backgroundColor: '#FFFFFF', color: '#000000', textDecoration: 'none', minHeight: '140px' }}>
      <span className="text-xs font-medium tracking-widest mb-3 opacity-70">{label}</span>
      <span className="text-5xl font-bold tabular-nums">{count}</span>
    </Link>
  )
}

function QuickLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  // E3-16: CSS hover instead of onMouseEnter/onMouseLeave
  return (
    <Link href={href} target={external ? '_blank' : undefined}
      className="text-xs px-6 py-3 text-center tracking-widest font-medium transition-colors duration-200 hover:bg-black hover:text-white hover:border-black"
      style={{ border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none', backgroundColor: '#FFFFFF' }}>
      {label}
    </Link>
  )
}
