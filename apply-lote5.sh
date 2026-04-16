#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# apply-lote5.sh — Self-contained patch for LOTE 5
# Embeds ALL file contents via heredocs. No external files needed.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

REPO="${1:-.}"

if [ ! -d "$REPO" ]; then
  echo "ERROR: Directory '$REPO' does not exist."
  exit 1
fi

echo "═══════════════════════════════════════════════════"
echo " LOTE 5 — Applying 13 files to: $REPO"
echo "═══════════════════════════════════════════════════"
echo ""

COUNT=0
TOTAL=13

# ────────────────────────────────────────────────────
# 1/13  app/api/admin/reservations/route.ts
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/api/admin/reservations"
cat << 'LOTE5EOF' > "$REPO/app/api/admin/reservations/route.ts"
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
async function requireAdmin() {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  return user
}
export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: 'No autorizado' }, { status: 401 })
  const admin = createAdminClient(); const now = new Date().toISOString()
  // Try to expire old reservations
  try {
    const { data: expired } = await admin.from('reservations')
      .update({ status: 'cancelled', cancelled_at: now })
      .eq('status', 'pending').lt('expires_at', now).select('release_id')
    if (expired?.length) {
      const ids = (expired as any[]).map(r => r.release_id).filter(Boolean)
      if (ids.length) await admin.from('releases').update({ status: 'active' }).in('id', ids)
    }
  } catch { /* ignore if cancelled_at column doesn't exist yet */ }

  const { data, error } = await admin.from('reservations')
    .select('id, status, customer_name, customer_phone, customer_email, expires_at, created_at, releases(id, title, artists, price, thumb)')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: 'Error al obtener reservas' }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return Response.json({ error: 'No autorizado' }, { status: 401 })
  const { id, action } = await request.json().catch(() => ({}))
  if (!id || !['confirm', 'collect', 'cancel'].includes(action))
    return Response.json({ error: 'Parámetros inválidos (usar: confirm, collect, cancel)' }, { status: 400 })
  const admin = createAdminClient()
  const { data: r } = await admin.from('reservations').select('release_id, status').eq('id', id).single()
  if (!r) return Response.json({ error: 'Reserva no encontrada' }, { status: 404 })

  if (action === 'confirm' && r.status !== 'pending')
    return Response.json({ error: 'Solo se pueden confirmar reservas pendientes' }, { status: 409 })
  if (action === 'collect' && r.status !== 'confirmed')
    return Response.json({ error: 'Solo se pueden marcar como recogidas las reservas confirmadas' }, { status: 409 })
  if (action === 'cancel' && r.status !== 'pending' && r.status !== 'confirmed')
    return Response.json({ error: 'Solo se pueden cancelar reservas pendientes o confirmadas' }, { status: 409 })

  // Helper: try update with timestamp column, fallback without if column missing
  async function safeUpdate(table: string, data: Record<string, unknown>, timestampField: string | null, id: string) {
    const adminClient = createAdminClient()
    if (timestampField) {
      const withTs = { ...data, [timestampField]: new Date().toISOString() }
      const { error } = await adminClient.from(table).update(withTs).eq('id', id)
      if (!error) return true
      // Column might not exist — retry without timestamp
      console.warn(`Column ${timestampField} may not exist, retrying without it:`, error.message)
    }
    const { error } = await adminClient.from(table).update(data).eq('id', id)
    if (error) {
      console.error(`Update ${table} error:`, error.message)
      return false
    }
    return true
  }

  if (action === 'confirm') {
    const ok = await safeUpdate('reservations', { status: 'confirmed' }, 'confirmed_at', id)
    if (!ok) return Response.json({ error: 'Error al confirmar la reserva' }, { status: 500 })
    await admin.from('releases').update({ status: 'sold' }).eq('id', r.release_id)
  } else if (action === 'collect') {
    const ok = await safeUpdate('reservations', { status: 'collected' }, 'collected_at', id)
    if (!ok) return Response.json({ error: 'Error al marcar como recogida' }, { status: 500 })
    // Release stays 'sold' after collection
  } else {
    // cancel
    const ok = await safeUpdate('reservations', { status: 'cancelled' }, 'cancelled_at', id)
    if (!ok) return Response.json({ error: 'Error al cancelar la reserva' }, { status: 500 })
    await admin.from('releases').update({ status: 'active' }).eq('id', r.release_id)
  }

  return Response.json({ ok: true })
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/api/admin/reservations/route.ts"

# ────────────────────────────────────────────────────
# 2/13  app/admin/page.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin"
cat << 'LOTE5EOF' > "$REPO/app/admin/page.tsx"
import Link           from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import SyncStatus     from '@/components/admin/SyncStatus'
import SeedButton     from '@/components/admin/SeedButton'
import type { SyncJob } from '@/types'

export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
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
    lastJob: lastJobRes.data as SyncJob | null,
  }
}

export default async function AdminDashboard() {
  const { active, sold, reserved, totalOrders, todayOrders, lastJob } = await getStats()

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InventoryButton href="/admin/orders" label="HOY" count={todayOrders} />
          <InventoryButton href="/admin/orders" label="TOTAL" count={totalOrders} />
        </div>
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
          <QuickLink href="/admin/barcodes" label="CÓDIGOS / ETIQUETAS" />
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
      className="flex flex-col items-center justify-center p-8 transition-colors duration-200"
      style={{
        border: '2px solid #000000',
        backgroundColor: '#FFFFFF',
        color: '#000000',
        textDecoration: 'none',
        minHeight: '140px',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#FFFFFF' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#000000' }}
    >
      <span className="text-xs font-medium tracking-widest mb-3 opacity-70">
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
      className="text-xs px-6 py-3 text-center tracking-widest font-medium transition-colors duration-200"
      style={{
        border: '1px solid #d1d5db',
        color: '#374151',
        textDecoration: 'none',
        backgroundColor: '#FFFFFF',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#000000' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#d1d5db' }}
    >
      {label}
    </Link>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/page.tsx"

# ────────────────────────────────────────────────────
# 3/13  app/admin/layout.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin"
cat << 'LOTE5EOF' > "$REPO/app/admin/layout.tsx"
import Link         from 'next/link'
import LogoutButton from '@/components/admin/LogoutButton'
const NAV_LINKS = [
  { href: '/admin',              label: 'Dashboard'  },
  { href: '/admin/inventory',    label: 'Inventario' },
  { href: '/admin/pricing',      label: 'Precios'    },
  { href: '/admin/shipping',     label: 'Envíos'     },
  { href: '/admin/reservations', label: 'Guardi'     },
  { href: '/admin/scan',         label: 'Escanear'   },
  { href: '/admin/barcodes',     label: 'Códigos'    },
  { href: '/admin/events',       label: 'Agenda'     },
  { href: '/admin/orders',       label: 'Pedidos'    },
  { href: '/admin/clientes',     label: 'Clientes'   },
]
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin-theme style={{ minHeight: '100dvh', backgroundColor: '#FFFFFF' }}>
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-6"
        style={{
          height: '56px',
          borderBottom: '1px solid #d4d4d4',
          backgroundColor: '#FFFFFF',
          zIndex: 100,
        }}>
        <Link href="/" className="flex items-center group relative" style={{ textDecoration: 'none', height: '40px', overflow: 'visible' }}>
          {/* Logo — se oculta en hover */}
          <span className="transition-opacity duration-200 group-hover:opacity-0" style={{ color: '#000000', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: '900', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
            RHYTHM CONTROL
          </span>
          <span className="transition-opacity duration-200 group-hover:opacity-0" style={{ color: '#6b7280', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: '400', fontSize: '0.75rem' }}>/ ADMIN</span>
          {/* BARCELONA — HELVETICA BLACK UPPERCASE, same height as logo, centered */}
          <span className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
            style={{ color: '#000000', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: '900', fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: '1' }}>
            BARCELONA
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="text-xs transition-colors hover:text-black"
              style={{ color: '#6b7280', fontFamily: 'var(--rc-font-mono)', letterSpacing: '0.07em' }}>{label}</Link>
          ))}
        </div>
        <LogoutButton />
      </nav>
      <div style={{ paddingTop: '56px' }}>{children}</div>
    </div>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/layout.tsx"

# ────────────────────────────────────────────────────
# 4/13  components/layout/Navigation.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/components/layout"
cat << 'LOTE5EOF' > "$REPO/components/layout/Navigation.tsx"
'use client'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navigation({ variant = 'default' }: { variant?: 'default' | 'magenta' | 'green' }) {
  const isMagenta = variant === 'magenta'
  const isGreen = variant === 'green'
  const bgColor = isMagenta ? '#FF00FF' : isGreen ? '#77DD77' : '#000000'
  const textColor = (isMagenta || isGreen) ? '#000000' : '#FFFFFF'
  const logoColor = (isMagenta || isGreen) ? '#000000' : '#F0E040'
  const borderColor = '#000000'
  const { totalItems, toggleCart } = useCart()
  const { t } = useLocale()

  const NAV_LINKS = [
    { href: '/novedades', label: t('nav.novedades') },
    { href: '/',          label: 'STOCK' },
    { href: '/contacto',  label: t('nav.contact')  },
  ]

  return (
    <header style={{ backgroundColor: bgColor, borderBottom: `2px solid ${borderColor}` }}>
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between" style={{ height: '120px', padding: '0 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', position: 'relative' }} className="group">
          {/* Logo — hides on hover */}
          <div className="transition-opacity duration-200 group-hover:opacity-0" style={{ display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 627.27 49.85" style={{ height: '60px', width: 'auto' }} fill={logoColor}>
              <g>
                <path d="M0,1.13h27.93c8.33,0,15.53,4.6,15.53,13.6,0,4.93-2.27,10.13-7.13,11.93,4,1.53,6.46,5.93,7,11.86.2,2.33.27,8,1.6,10.2h-14.66c-.73-2.4-1-4.87-1.2-7.33-.4-4.53-.8-9.26-6.6-9.26h-7.8v16.6H0V1.13ZM14.66,21.93h7.67c2.73,0,6.46-.47,6.46-4.73,0-3-1.67-4.73-7.26-4.73h-6.86v9.46Z"/>
                <path d="M46.75,1.13h14.66v16.53h13.73V1.13h14.66v47.59h-14.66v-18.86h-13.73v18.86h-14.66V1.13Z"/>
                <path d="M105.62,31.19L88.89,1.13h16.2l7.93,17.53L121.29,1.13h16.06l-17.06,30.06v17.53h-14.66v-17.53Z"/>
                <path d="M147.63,13.33h-13.33V1.13h41.32v12.2h-13.33v35.39h-14.66V13.33Z"/>
                <path d="M178.38,1.13h14.66v16.53h13.73V1.13h14.66v47.59h-14.66v-18.86h-13.73v18.86h-14.66V1.13Z"/>
                <path d="M226.26,1.13h20.86l6.8,27.99h.13l6.8-27.99h20.86v47.59h-13.87v-30.53h-.13l-8.26,30.53h-10.93l-8.26-30.53h-.14v30.53h-13.86V1.13Z"/>
                <path d="M336.2,18.86c-.27-1.73-1.6-7-7.66-7-6.86,0-9.07,6.66-9.07,13.06s2.2,13.06,9.07,13.06c4.93,0,6.86-3.46,7.73-7.93h14.39c0,9.59-7.8,19.79-21.73,19.79-15.4,0-24.13-10.86-24.13-24.93,0-14.99,9.46-24.93,24.13-24.93,13.06.07,20.26,6.93,21.53,18.86h-14.26Z"/>
                <path d="M376.88,0c14.46,0,24.12,10.4,24.12,24.93s-9.66,24.93-24.12,24.93-24.13-10.4-24.13-24.93S362.42,0,376.88,0ZM376.88,37.99c3.73,0,9.46-2.46,9.46-13.06s-5.73-13.06-9.46-13.06-9.46,2.47-9.46,13.06,5.73,13.06,9.46,13.06Z"/>
                <path d="M404.64,1.13h14.99l13.86,25.46h.13V1.13h13.86v47.59h-14.26l-14.6-25.99h-.13v25.99h-13.86V1.13Z"/>
                <path d="M463.64,13.33h-13.33V1.13h41.32v12.2h-13.33v35.39h-14.66V13.33Z"/>
                <path d="M494.39,1.13h27.93c8.33,0,15.53,4.6,15.53,13.6,0,4.93-2.27,10.13-7.13,11.93,4,1.53,6.46,5.93,7,11.86.2,2.33.27,8,1.6,10.2h-14.66c-.73-2.4-1-4.87-1.2-7.33-.4-4.53-.8-9.26-6.6-9.26h-7.8v16.6h-14.66V1.13ZM509.05,21.93h7.66c2.74,0,6.47-.47,6.47-4.73,0-3-1.67-4.73-7.26-4.73h-6.86v9.46Z"/>
                <path d="M563.87,0c14.46,0,24.13,10.4,24.13,24.93s-9.67,24.93-24.13,24.93-24.13-10.4-24.13-24.93,9.67-24.93,24.13-24.93ZM563.87,37.99c3.73,0,9.46-2.46,9.46-13.06s-5.73-13.06-9.46-13.06-9.46,2.47-9.46,13.06,5.73,13.06,9.46,13.06Z"/>
                <path d="M591.55,1.13h14.66v35.39h21.06v12.2h-35.72V1.13Z"/>
              </g>
            </svg>
          </div>
          {/* BARCELONA — HELVETICA BLACK UPPERCASE, same height as logo, centered */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="whitespace-nowrap"
              style={{ color: textColor, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '3.75rem', lineHeight: '1', fontWeight: '900', letterSpacing: '-0.02em' }}>
              BARCELONA
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="font-display text-xs transition-opacity hover:opacity-60" style={{ color: textColor, cursor: 'pointer' }}>
              {label}
            </Link>
          ))}
          <button onClick={toggleCart} className="flex items-center gap-2 font-display text-xs transition-opacity hover:opacity-60" style={{ color: textColor, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            CARRITO ({totalItems})
          </button>
          <Link href="/cuenta" className="font-display text-xs transition-opacity hover:opacity-60" style={{ color: textColor, cursor: 'pointer' }}>
            {t('nav.account')}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between" style={{ height: '80px', padding: '0 16px' }}>
          <Link href="/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 627.27 49.85" style={{ height: '40px', width: 'auto' }} fill={logoColor}>
              <g>
                <path d="M0,1.13h27.93c8.33,0,15.53,4.6,15.53,13.6,0,4.93-2.27,10.13-7.13,11.93,4,1.53,6.46,5.93,7,11.86.2,2.33.27,8,1.6,10.2h-14.66c-.73-2.4-1-4.87-1.2-7.33-.4-4.53-.8-9.26-6.6-9.26h-7.8v16.6H0V1.13ZM14.66,21.93h7.67c2.73,0,6.46-.47,6.46-4.73,0-3-1.67-4.73-7.26-4.73h-6.86v9.46Z"/>
                <path d="M46.75,1.13h14.66v16.53h13.73V1.13h14.66v47.59h-14.66v-18.86h-13.73v18.86h-14.66V1.13Z"/>
                <path d="M105.62,31.19L88.89,1.13h16.2l7.93,17.53L121.29,1.13h16.06l-17.06,30.06v17.53h-14.66v-17.53Z"/>
                <path d="M147.63,13.33h-13.33V1.13h41.32v12.2h-13.33v35.39h-14.66V13.33Z"/>
                <path d="M178.38,1.13h14.66v16.53h13.73V1.13h14.66v47.59h-14.66v-18.86h-13.73v18.86h-14.66V1.13Z"/>
                <path d="M226.26,1.13h20.86l6.8,27.99h.13l6.8-27.99h20.86v47.59h-13.87v-30.53h-.13l-8.26,30.53h-10.93l-8.26-30.53h-.14v30.53h-13.86V1.13Z"/>
                <path d="M336.2,18.86c-.27-1.73-1.6-7-7.66-7-6.86,0-9.07,6.66-9.07,13.06s2.2,13.06,9.07,13.06c4.93,0,6.86-3.46,7.73-7.93h14.39c0,9.59-7.8,19.79-21.73,19.79-15.4,0-24.13-10.86-24.13-24.93,0-14.99,9.46-24.93,24.13-24.93,13.06.07,20.26,6.93,21.53,18.86h-14.26Z"/>
                <path d="M376.88,0c14.46,0,24.12,10.4,24.12,24.93s-9.66,24.93-24.12,24.93-24.13-10.4-24.13-24.93S362.42,0,376.88,0ZM376.88,37.99c3.73,0,9.46-2.46,9.46-13.06s-5.73-13.06-9.46-13.06-9.46,2.47-9.46,13.06,5.73,13.06,9.46,13.06Z"/>
                <path d="M404.64,1.13h14.99l13.86,25.46h.13V1.13h13.86v47.59h-14.26l-14.6-25.99h-.13v25.99h-13.86V1.13Z"/>
                <path d="M463.64,13.33h-13.33V1.13h41.32v12.2h-13.33v35.39h-14.66V13.33Z"/>
                <path d="M494.39,1.13h27.93c8.33,0,15.53,4.6,15.53,13.6,0,4.93-2.27,10.13-7.13,11.93,4,1.53,6.46,5.93,7,11.86.2,2.33.27,8,1.6,10.2h-14.66c-.73-2.4-1-4.87-1.2-7.33-.4-4.53-.8-9.26-6.6-9.26h-7.8v16.6h-14.66V1.13ZM509.05,21.93h7.66c2.74,0,6.47-.47,6.47-4.73,0-3-1.67-4.73-7.26-4.73h-6.86v9.46Z"/>
                <path d="M563.87,0c14.46,0,24.13,10.4,24.13,24.93s-9.67,24.93-24.13,24.93-24.13-10.4-24.13-24.93,9.67-24.93,24.13-24.93ZM563.87,37.99c3.73,0,9.46-2.46,9.46-13.06s-5.73-13.06-9.46-13.06-9.46,2.47-9.46,13.06,5.73,13.06,9.46,13.06Z"/>
                <path d="M591.55,1.13h14.66v35.39h21.06v12.2h-35.72V1.13Z"/>
              </g>
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button onClick={toggleCart} className="font-display text-xs" style={{ color: textColor, cursor: 'pointer' }}>CARRITO ({totalItems})</button>
          </div>
        </div>
        <nav className="flex items-center justify-center gap-6 border-t border-gray-800" style={{ padding: '10px 16px' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="font-display text-xs" style={{ color: textColor, cursor: 'pointer' }}>{label}</Link>
          ))}
          <Link href="/cuenta" className="font-display text-xs" style={{ color: textColor, cursor: 'pointer' }}>{t('nav.account')}</Link>
        </nav>
      </div>
    </header>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] components/layout/Navigation.tsx"

# ────────────────────────────────────────────────────
# 5/13  app/cuenta/favoritos/BuyButton.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/cuenta/favoritos"
cat << 'LOTE5EOF' > "$REPO/app/cuenta/favoritos/BuyButton.tsx"
'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import type { Release } from '@/types'

export default function BuyButton({ release }: { release: any }) {
  const { addItem, openCart } = useCart()
  const [added, setAdded] = useState(false)

  function handleBuy() {
    const item: Partial<Release> & { quantity: number } = {
      id: release.id,
      title: release.title,
      artists: release.artists ?? [],
      price: release.price ?? 0,
      cover_image: release.cover_image ?? '',
      condition: release.condition ?? '',
      format: release.format ?? '',
      labels: release.labels ?? [],
      discogs_listing_id: release.discogs_listing_id ?? 0,
      quantity: 1,
    }
    addItem(item as any)
    openCart()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button onClick={handleBuy}
      className="font-display text-xs px-4 py-2 transition-opacity hover:opacity-80"
      style={{ backgroundColor: '#F0E040', color: '#000000', cursor: 'pointer' }}>
      {added ? 'AÑADIDO ✓' : 'COMPRAR'}
    </button>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/cuenta/favoritos/BuyButton.tsx"

# ────────────────────────────────────────────────────
# 6/13  app/cuenta/favoritos/page.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/cuenta/favoritos"
cat << 'LOTE5EOF' > "$REPO/app/cuenta/favoritos/page.tsx"
// app/cuenta/favoritos/page.tsx
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import RemoveFavorite from './RemoveFavorite'
import BuyButton from './BuyButton'

export default async function FavoritosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: favorites } = await supabase
    .from('wantlist')
    .select(`id, added_at, releases(id, title, artists, cover_image, price, status, condition, format, labels, discogs_listing_id)`)
    .eq('user_id', user!.id)
    .order('added_at', { ascending: false })

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>
        MIS FAVORITOS
      </h1>

      {(!favorites || favorites.length === 0) ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>
            Tu lista de favoritos está vacía.
          </p>
          <a href="/" className="inline-block mt-6 font-display text-xs px-6 py-3"
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>
            EXPLORAR STOCK
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav: any) => {
            const release = fav.releases
            if (!release) return null
            const isAvailable = release.status === 'active'

            return (
              <div key={fav.id} className="flex gap-4 p-4" style={{ border: '2px solid #FFFFFF' }}>
                <div className="w-20 h-20 shrink-0 relative" style={{ border: '1px solid #333' }}>
                  {release.cover_image ? (
                    <Image src={release.cover_image} alt={release.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>
                    {release.artists?.[0] || '—'}
                  </p>
                  <p className="font-display text-sm" style={{ color: '#F0E040' }}>
                    {release.title}
                  </p>
                  <p className="font-meta text-xs mt-1" style={{ color: '#FFFFFF' }}>
                    {release.price?.toFixed(2)} €
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <span className="font-meta text-xs px-2 py-1"
                    style={{
                      border: isAvailable ? '1px solid #22c55e' : '1px solid #ef4444',
                      color: isAvailable ? '#22c55e' : '#ef4444'
                    }}>
                    {isAvailable ? 'DISPONIBLE' : 'VENDIDO'}
                  </span>
                  {isAvailable && <BuyButton release={release} />}
                  <RemoveFavorite favoriteId={fav.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/cuenta/favoritos/page.tsx"

# ────────────────────────────────────────────────────
# 7/13  context/CartContext.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/context"
cat << 'LOTE5EOF' > "$REPO/context/CartContext.tsx"
'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Release } from '@/types'

export interface CartItem extends Release {
  quantity: number
  stock_quantity?: number  // max available units from releases.quantity
}

interface CartContextType {
  items: CartItem[]
  addItem: (release: Release) => void
  removeItem: (listingId: number) => void
  updateQuantity: (listingId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isOpen: boolean
  toggleCart: () => void
  openCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('rhythm_cart')
    if (saved) setItems(JSON.parse(saved))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('rhythm_cart', JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (release: Release) => {
    const maxStock = (release as any).stock_quantity ?? (release as any).quantity ?? 999
    setItems(prev => {
      const exists = prev.find(i => i.discogs_listing_id === release.discogs_listing_id)
      if (exists) {
        // Increment quantity but cap at stock
        const newQty = Math.min(exists.quantity + 1, maxStock)
        return prev.map(i =>
          i.discogs_listing_id === release.discogs_listing_id
            ? { ...i, quantity: newQty }
            : i
        )
      }
      return [...prev, { ...release, quantity: 1, stock_quantity: maxStock } as CartItem]
    })
    setIsOpen(true)
  }

  const removeItem = (listingId: number) => {
    setItems(prev => prev.filter(i => i.discogs_listing_id !== listingId))
  }

  const updateQuantity = (listingId: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(listingId)
      return
    }
    setItems(prev => prev.map(i =>
      i.discogs_listing_id === listingId ? { ...i, quantity } : i
    ))
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0)

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPrice, isOpen,
      toggleCart: () => setIsOpen(!isOpen),
      openCart: () => setIsOpen(true)
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] context/CartContext.tsx"

# ────────────────────────────────────────────────────
# 8/13  components/cart/CartDrawer.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/components/cart"
cat << 'LOTE5EOF' > "$REPO/components/cart/CartDrawer.tsx"
'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import Image from 'next/image'
import type { ShippingRate } from '@/types'

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalPrice, isOpen, toggleCart, clearCart } = useCart() as any
  const { t } = useLocale()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<string>('')
  const [showShipping, setShowShipping] = useState(false)

  async function loadShippingRates() {
    try {
      const res = await fetch('/api/shipping-rates')
      if (res.ok) {
        const data = await res.json()
        setShippingRates(data.rates || [])
        const clickCollect = data.rates?.find((r: ShippingRate) => r.method === 'click_collect')
        if (clickCollect) setSelectedRate(clickCollect.id)
        setShowShipping(true)
      }
    } catch {
      setCheckoutError(t('cart.shippingError'))
    }
  }

  async function handleCheckout() {
    if (items.length === 0) return
    if (!showShipping) { loadShippingRates(); return }
    if (!selectedRate) { setCheckoutError(t('cart.selectShipping')); return }

    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i: any) => ({
            id: i.id, discogs_listing_id: i.discogs_listing_id,
            title: i.title, artists: i.artists, condition: i.condition,
            format: i.format, labels: i.labels, cover_image: i.cover_image,
            price: i.price, quantity: i.quantity,
          })),
          shippingRateId: selectedRate, channel: 'online',
        }),
      })
      const data = await res.json()
      if (res.ok && data.url) { window.location.href = data.url }
      else { setCheckoutError(data.error || t('cart.checkoutError')) }
    } catch { setCheckoutError(t('cart.connectionError')) }
    finally { setCheckoutLoading(false) }
  }

  if (!isOpen) return null

  const selectedShippingRate = shippingRates.find(r => r.id === selectedRate)
  const shippingCost = selectedShippingRate?.price ?? 0
  const grandTotal = totalPrice + shippingCost

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black opacity-50" onClick={toggleCart} />
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col border-l-2 border-black text-black">

        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="font-display uppercase text-xl" style={{ letterSpacing: '-0.05em', color: '#000000' }}>
            CARRITO ({items.length})
          </h2>
          <button onClick={toggleCart} className="font-display text-xs" style={{ color: '#000000', cursor: 'pointer' }}>✕ CERRAR</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="font-mono text-xs text-center mt-20" style={{ color: '#000000' }}>{t('cart.empty')}</p>
          ) : (
            items.map((item: any) => (
              <div key={item.discogs_listing_id} className="flex gap-3 border-b border-gray-300 pb-3">
                <div className="w-16 h-16 relative border border-black flex-shrink-0 bg-gray-100">
                  <Image src={item.cover_image || '/placeholder.png'} alt={item.title} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs uppercase truncate" style={{ letterSpacing: '-0.02em', color: '#000000' }}>
                    {item.artists[0]} — {item.title}
                  </p>
                  <p className="font-mono text-xs mt-1" style={{ color: '#000000' }}>{item.condition}</p>

                  {/* Quantity selector — capped by available stock */}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity?.(item.discogs_listing_id, Math.max(1, (item.quantity || 1) - 1))}
                      className="w-6 h-6 flex items-center justify-center text-xs"
                      style={{ border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: '#f9fafb' }}>−</button>
                    <span className="font-mono text-xs w-6 text-center" style={{ color: '#000000' }}>{item.quantity || 1}</span>
                    <button onClick={() => {
                      const stockQty = (item as any).stock_quantity ?? (item as any).quantity ?? 999
                      const currentQty = item.quantity || 1
                      if (currentQty < stockQty) {
                        updateQuantity?.(item.discogs_listing_id, currentQty + 1)
                      }
                    }}
                      className="w-6 h-6 flex items-center justify-center text-xs"
                      style={{ border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: '#f9fafb', opacity: (item.quantity || 1) >= ((item as any).stock_quantity ?? 999) ? 0.3 : 1 }}>+</button>
                    {((item as any).stock_quantity != null && (item as any).stock_quantity > 1) && (
                      <span className="font-mono text-[10px]" style={{ color: '#999' }}>/ {(item as any).stock_quantity} uds.</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-display text-sm" style={{ color: '#000000' }}>{(item.price * (item.quantity || 1)).toFixed(2)} €</span>
                    <button onClick={() => removeItem(item.discogs_listing_id)} className="font-display text-xs hover:underline" style={{ color: '#000000', cursor: 'pointer' }}>{t('btn.remove')}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Shipping selection */}
        {showShipping && items.length > 0 && (
          <div className="border-t border-gray-300 p-4">
            <p className="font-display text-xs mb-3" style={{ color: '#000' }}>{t('cart.shippingMethod')}</p>
            <div className="space-y-2">
              {shippingRates.map(rate => (
                <label key={rate.id}
                  className="flex items-center gap-3 p-2"
                  style={{
                    border: selectedRate === rate.id ? '2px solid #000' : '1px solid #ccc',
                    backgroundColor: selectedRate === rate.id ? '#f5f5f5' : 'transparent',
                    cursor: 'pointer',
                  }}>
                  <input type="radio" name="shipping" value={rate.id} checked={selectedRate === rate.id}
                    onChange={() => setSelectedRate(rate.id)} className="accent-black" />
                  <div className="flex-1">
                    <p className="font-display text-xs" style={{ color: '#000' }}>{rate.name}</p>
                    {rate.description && <p className="font-meta text-xs" style={{ color: '#666' }}>{rate.description}</p>}
                  </div>
                  <span className="font-display text-xs" style={{ color: '#000' }}>
                    {rate.price === 0 ? t('cart.free') : `${rate.price.toFixed(2)} €`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="border-t-2 border-black p-4 space-y-4 bg-white">
          {showShipping && selectedShippingRate && (
            <div className="flex justify-between font-meta text-xs" style={{ color: '#666' }}>
              <span>{t('cart.shipping')} ({selectedShippingRate.name})</span>
              <span>{shippingCost === 0 ? t('cart.free') : `${shippingCost.toFixed(2)} €`}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-lg" style={{ color: '#000000' }}>
            <span>{t('cart.total')}</span>
            <span>{showShipping ? grandTotal.toFixed(2) : totalPrice.toFixed(2)} €</span>
          </div>
          {checkoutError && <p className="font-meta text-xs" style={{ color: '#ef4444' }}>{checkoutError}</p>}
          <button
            className="w-full py-3 font-display text-sm uppercase bg-black text-white hover:bg-[#F0E040] hover:text-black transition-colors disabled:opacity-30"
            style={{ cursor: 'pointer' }}
            disabled={items.length === 0 || checkoutLoading}
            onClick={handleCheckout}>
            {checkoutLoading ? t('cart.processing') : showShipping ? t('cart.pay') : t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] components/cart/CartDrawer.tsx"

# ────────────────────────────────────────────────────
# 9/13  components/store/FavoriteButton.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/components/store"
cat << 'LOTE5EOF' > "$REPO/components/store/FavoriteButton.tsx"
'use client'
// components/store/FavoriteButton.tsx
// Corazón: posicionado encima del texto/botón en cards (NO en la esquina superior).
// Solo perfilado blanco, se pone amarillo en hover/active (magenta en tema magenta).
// Sin fondo gris semi-transparente.

import { useState, useEffect } from 'react'
import { useLocale } from '@/context/LocaleContext'

interface FavoriteButtonProps {
  releaseId: string
  discogsReleaseId?: number
  initialFavorited?: boolean
  size?: number
  variant?: 'card' | 'modal'
  theme?: 'default' | 'magenta' | 'green'
}

export default function FavoriteButton({
  releaseId,
  discogsReleaseId,
  initialFavorited = false,
  size = 18,
  variant = 'card',
  theme = 'default',
}: FavoriteButtonProps) {
  const { t } = useLocale()
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(initialFavorited)
  const [hovering, setHovering] = useState(false)

  const accentColor = theme === 'magenta' ? '#FF00FF' : theme === 'green' ? '#77DD77' : '#F0E040'

  useEffect(() => {
    if (initialFavorited) return
    async function check() {
      try {
        const res = await fetch('/api/cuenta/favoritos')
        if (res.ok) {
          const data = await res.json()
          if (discogsReleaseId) {
            const isFav = data.favorites?.some((f: any) => f.discogs_release_id === discogsReleaseId)
            setFavorited(!!isFav)
          }
        }
      } catch { /* silencioso */ }
      setChecked(true)
    }
    check()
  }, [discogsReleaseId, initialFavorited])

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      if (favorited) {
        const res = await fetch('/api/cuenta/favoritos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ release_id: releaseId }),
        })
        if (res.ok) setFavorited(false)
      } else {
        const res = await fetch('/api/cuenta/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ release_id: releaseId }),
        })
        if (res.ok) setFavorited(true)
      }
    } catch { /* silencioso */ }
    setLoading(false)
  }

  // Determine visual state
  const fillColor = favorited ? accentColor : (hovering ? accentColor : 'none')
  const strokeColor = favorited ? accentColor : (hovering ? accentColor : '#FFFFFF')

  const heartSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'fill 0.15s ease, stroke 0.15s ease, transform 0.15s ease',
        transform: loading ? 'scale(0.85)' : favorited ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )

  if (variant === 'card') {
    return (
      <button
        onClick={toggle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="absolute left-0 z-30 transition-opacity"
        style={{
          opacity: !checked ? 0 : 1,
          transition: 'opacity 0.2s ease',
          cursor: 'pointer',
          padding: '2px',
          // Position just above the buttons row
          top: '-22px',
        }}
        aria-label={favorited ? t('btn.inFavorites') : t('btn.favorite')}
      >
        {heartSvg}
      </button>
    )
  }

  // Modal variant: inline button
  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="flex items-center gap-2 font-display text-xs px-4 py-2 transition-colors hover:opacity-80 shrink-0"
      style={{
        border: favorited ? `2px solid ${accentColor}` : '2px solid #FFFFFF',
        color: favorited ? accentColor : '#FFFFFF',
        backgroundColor: favorited ? `${accentColor}1a` : 'transparent',
        cursor: 'pointer',
      }}
      aria-label={favorited ? t('btn.inFavorites') : t('btn.favorite')}
    >
      {heartSvg}
      {favorited ? t('btn.inFavorites') : t('btn.favorite')}
    </button>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] components/store/FavoriteButton.tsx"

# ────────────────────────────────────────────────────
# 10/13  components/store/RecordCard.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/components/store"
cat << 'LOTE5EOF' > "$REPO/components/store/RecordCard.tsx"
'use client'
import { useState }   from 'react'
import Image          from 'next/image'
import { Marquee }    from '@/components/ui/Marquee'
import { useCart }    from '@/context/CartContext'
import { useLocale }  from '@/context/LocaleContext'
import FavoriteButton from '@/components/store/FavoriteButton'
import type { Release, PlayerTrack } from '@/types'

interface RecordCardProps {
  release: Release; onSelect: (release: Release) => void
  onPlay: (track: PlayerTrack, clipIndex: number) => void; theme?: 'default' | 'magenta' | 'green'
  isNew?: boolean
}

export default function RecordCard({ release, onSelect, theme = 'default', isNew = false }: RecordCardProps) {
  const { addItem } = useCart()
  const { t } = useLocale()
  const artist      = release.artists[0] ?? '—'
  const accentColor = theme === 'magenta' ? '#FF00FF' : theme === 'green' ? '#77DD77' : '#F0E040'
  const status      = (release as any).status ?? 'active'
  const isAvailable = status === 'active'

  return (
    <>
      <article className="group relative overflow-hidden"
        style={{ aspectRatio: '1', backgroundColor: '#000000', cursor: 'pointer' }}
        onClick={() => onSelect(release)}>

        <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
          style={{ backgroundColor: accentColor }} />

        {/* Default State */}
        <div className="absolute inset-0 transition-opacity duration-[250ms] group-hover:opacity-0">
          {release.cover_image
            ? <Image src={release.cover_image} alt={`${artist} — ${release.title}`}
                fill className="object-cover" sizes="(max-width: 768px) 50vw, 16vw" unoptimized />
            : <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />}
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <span className="font-display text-xs px-3 py-1"
                style={{ border: '1px solid #FFFFFF', color: '#FFFFFF' }}>
                {status === 'reserved' ? t('catalogue.reserved') : t('catalogue.sold')}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent)' }}>
            <Marquee text={artist}        style={{ color: '#FFFFFF',   fontSize: '1.3rem', lineHeight: '1.1' }} />
            <Marquee text={release.title} style={{ color: accentColor, fontSize: '1.3rem', lineHeight: '1.1' }} />
          </div>
        </div>

        {/* Hover State */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100"
          style={{ backgroundColor: '#000000' }}>
          
          {/* Top section: Artist + Title + Info */}
          <div style={{ marginLeft: '6px' }}>
            <Marquee text={artist}        style={{ color: '#FFFFFF',   fontSize: '1.3rem', lineHeight: '1.1' }} />
            <Marquee text={release.title} style={{ color: accentColor, fontSize: '1.3rem', lineHeight: '1.1' }} />
            <p className="font-display text-sm font-bold mt-1" style={{ color: '#FFFFFF' }}>{release.labels[0] ?? ''}</p>
            <p className="font-meta text-xs mt-1" style={{ color: '#FFFFFF' }}>{[release.year, release.format].filter(Boolean).join(' · ')}</p>
          </div>

          {/* Bottom section: Heart above buttons */}
          <div className="relative">
            <FavoriteButton releaseId={release.id} discogsReleaseId={release.discogs_release_id} variant="card" size={16} theme={theme} />
            <div className="flex gap-2" style={{ marginLeft: '6px' }}>
              <button className="font-display text-xs px-4 py-2"
                style={{ backgroundColor: accentColor, color: '#000000', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); onSelect(release) }}>
                {t('btn.listen')}
              </button>
              {isAvailable ? (
                <>
                  <button className="flex-1 flex items-center justify-center gap-1 font-display text-xs px-2 py-2"
                    style={{ border: '2px solid #FFFFFF', color: '#FFFFFF', cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); addItem(release) }}>
                    <span style={{ fontWeight: 700 }}>
                      {release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </button>
                </>
              ) : (
                <span className="flex-1 flex items-center justify-center font-display text-xs"
                  style={{ border: '1px solid #333', color: '#FFFFFF' }}>
                  {status === 'reserved' ? t('catalogue.reserved') : t('catalogue.sold')}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] components/store/RecordCard.tsx"

# ────────────────────────────────────────────────────
# 11/13  app/admin/orders/page.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin/orders"
cat << 'LOTE5EOF' > "$REPO/app/admin/orders/page.tsx"
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'
import Link                  from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  created:    { label: 'CREADO',      color: '#6b7280', bg: '#f3f4f6' },
  processing: { label: 'PROCESANDO',  color: '#d97706', bg: '#fffbeb' },
  paid:       { label: 'PAGADO',      color: '#059669', bg: '#ecfdf5' },
  shipped:    { label: 'ENVIADO',     color: '#2563eb', bg: '#eff6ff' },
  delivered:  { label: 'ENTREGADO',   color: '#16a34a', bg: '#f0fdf4' },
  collected:  { label: 'RECOGIDO',    color: '#16a34a', bg: '#f0fdf4' },
  cancelled:  { label: 'CANCELADO',   color: '#dc2626', bg: '#fef2f2' },
  pending:    { label: 'PENDIENTE',   color: '#d97706', bg: '#fffbeb' },
}

export default async function OrdersPage() {
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: orders, error } = await admin
    .from('orders')
    .select('id, order_number, user_id, total, status, payment_status, shipping_method, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-sm" style={{ color: '#ef4444' }}>Error al cargar pedidos: {error.message}</p>
          <p className="text-xs mt-2" style={{ color: '#6b7280' }}>Verifica que la tabla "orders" existe en Supabase.</p>
        </div>
      </div>
    )
  }

  const orderList = orders ?? []
  const totalRevenue = orderList
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0)
  const paidCount = orderList.filter(o => o.payment_status === 'paid').length
  const pendingCount = orderList.filter(o => o.payment_status === 'pending').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>PEDIDOS</h1>
        <div className="flex gap-4 text-xs" style={{ color: '#6b7280' }}>
          <span>{orderList.length} pedidos</span>
          <span style={{ color: '#16a34a' }}>{paidCount} pagados</span>
          <span style={{ color: '#d97706' }}>{pendingCount} pendientes</span>
          <span>Ingresos: {totalRevenue.toFixed(2)} €</span>
        </div>
      </div>

      {orderList.length === 0 ? (
        <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>No hay pedidos todavía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '2px solid #000000' }}>
                {['PEDIDO', 'FECHA', 'MÉTODO', 'ESTADO PAGO', 'ESTADO', 'TOTAL', ''].map((h, i) => (
                  <th key={i} className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderList.map(order => {
                const paymentSt = STATUS[order.payment_status ?? 'pending'] ?? STATUS.pending
                const orderSt = STATUS[order.status ?? 'created'] ?? STATUS.created
                return (
                  <tr key={order.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="px-3 py-3">
                      <p className="text-sm font-bold" style={{ color: '#000000' }}>
                        {order.order_number || order.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>
                      {new Date(order.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#374151' }}>
                      {order.shipping_method === 'click_collect' ? 'GUARDI' :
                       order.shipping_method === 'home_delivery' ? 'ENVÍO' :
                       order.shipping_method ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{ color: paymentSt.color, border: `1px solid ${paymentSt.color}`, backgroundColor: paymentSt.bg }}>
                        {paymentSt.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{ color: orderSt.color, border: `1px solid ${orderSt.color}`, backgroundColor: orderSt.bg }}>
                        {orderSt.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                      {Number(order.total).toFixed(2)} €
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/order/${order.id}`}
                        className="text-xs px-3 py-1 hover:bg-black hover:text-white transition-colors"
                        style={{ border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none' }}>
                        VER
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/orders/page.tsx"

# ────────────────────────────────────────────────────
# 12/13  app/admin/order/[id]/page.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin/order/[id]"
cat << 'LOTE5EOF' > "$REPO/app/admin/order/[id]/page.tsx"
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  created:    { label: 'CREADO',      color: '#6b7280', bg: '#f3f4f6' },
  processing: { label: 'PROCESANDO',  color: '#d97706', bg: '#fffbeb' },
  paid:       { label: 'PAGADO',      color: '#059669', bg: '#ecfdf5' },
  shipped:    { label: 'ENVIADO',     color: '#2563eb', bg: '#eff6ff' },
  delivered:  { label: 'ENTREGADO',   color: '#16a34a', bg: '#f0fdf4' },
  collected:  { label: 'RECOGIDO',    color: '#16a34a', bg: '#f0fdf4' },
  cancelled:  { label: 'CANCELADO',   color: '#dc2626', bg: '#fef2f2' },
  pending:    { label: 'PENDIENTE',   color: '#d97706', bg: '#fffbeb' },
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select('id, order_number, user_id, total, status, payment_status, shipping_method, shipping_address, pickup_code, tracking_code, tracking_carrier, tracking_url, created_at, metadata')
    .eq('id', params.id)
    .single()

  if (error || !order) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <Link href="/admin/orders" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
          <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>PEDIDO NO ENCONTRADO</h1>
          <div />
        </div>
        <div className="p-4" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-sm" style={{ color: '#ef4444' }}>No se encontró el pedido {params.id}</p>
        </div>
      </div>
    )
  }

  // Get customer profile
  let customer: any = null
  if (order.user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, username, first_name, last_name, phone, address, city, postal_code, country')
      .eq('id', order.user_id)
      .single()
    customer = profile
  }

  // Parse order items from metadata
  const items: any[] = (order as any).metadata?.items ?? []
  const shippingAddr = order.shipping_address ?? (customer ? {
    address: customer.address,
    city: customer.city,
    postal_code: customer.postal_code,
    country: customer.country,
  } : null)

  const orderSt = STATUS[order.status ?? 'created'] ?? STATUS.created
  const paymentSt = STATUS[order.payment_status ?? 'pending'] ?? STATUS.pending

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin/orders" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
        <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>PEDIDO {order.order_number || order.id.slice(0, 8)}</h1>
        <span className="text-xs px-3 py-1" style={{ color: orderSt.color, border: `1px solid ${orderSt.color}`, backgroundColor: orderSt.bg }}>{orderSt.label}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Customer info */}
        <div className="md:col-span-1 space-y-6">
          {customer && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>CLIENTE</h3>
              <p className="text-sm font-bold" style={{ color: '#000000' }}>
                {customer.first_name && customer.last_name ? `${customer.first_name} ${customer.last_name}` : customer.username || '—'}
              </p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{customer.email}</p>
              {customer.phone && <p className="text-xs" style={{ color: '#6b7280' }}>{customer.phone}</p>}
            </div>
          )}

          {shippingAddr && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>DIRECCIÓN DE ENVÍO</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>
                {(shippingAddr as any).address || ''}<br />
                {(shippingAddr as any).postal_code || ''} {(shippingAddr as any).city || ''}<br />
                {(shippingAddr as any).country || ''}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>PAGO</h3>
            <span className="text-xs px-2 py-1" style={{ color: paymentSt.color, border: `1px solid ${paymentSt.color}`, backgroundColor: paymentSt.bg }}>
              {paymentSt.label}
            </span>
          </div>

          {order.pickup_code && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>CÓDIGO DE RECOGIDA</h3>
              <p className="font-display text-xl" style={{ color: '#000000', letterSpacing: '0.1em' }}>{order.pickup_code}</p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>MÉTODO DE ENVÍO</h3>
            <p className="text-xs" style={{ color: '#374151' }}>
              {order.shipping_method === 'click_collect' ? 'GUARDI (Click & Collect)' :
               order.shipping_method === 'home_delivery' ? 'Envío a domicilio' :
               order.shipping_method ?? '—'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>FECHA</h3>
            <p className="text-xs" style={{ color: '#374151' }}>
              {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Right column: Items + Tracking */}
        <div className="md:col-span-2 space-y-8">
          {items.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-4" style={{ color: '#6b7280' }}>ARTÍCULOS</h3>
              <div style={{ border: '1px solid #d1d5db' }}>
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-12 h-12 object-cover" style={{ border: '1px solid #d1d5db' }} />
                    ) : (
                      <div className="w-12 h-12" style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase truncate" style={{ color: '#000000' }}>{item.artists?.[0] ?? '—'}</p>
                      <p className="text-xs truncate" style={{ color: '#6b7280' }}>{item.title}</p>
                    </div>
                    <p className="text-sm" style={{ color: '#000000' }}>{Number(item.price).toFixed(2)} €</p>
                  </div>
                ))}
                <div className="p-3 text-right" style={{ backgroundColor: '#f9fafb' }}>
                  <p className="text-lg font-bold" style={{ color: '#000000' }}>TOTAL: {Number(order.total).toFixed(2)} €</p>
                </div>
              </div>
            </div>
          )}

          {order.tracking_code && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>
                SEGUIMIENTO {order.tracking_carrier || ''}
              </h3>
              {order.tracking_url ? (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline block mb-2" style={{ color: '#2563eb' }}>
                  CÓDIGO: {order.tracking_code} → VER EN WEB
                </a>
              ) : (
                <p className="text-xs" style={{ color: '#374151' }}>CÓDIGO: {order.tracking_code}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/order/[id]/page.tsx"

# ────────────────────────────────────────────────────
# 13/13  app/cuenta/pedidos/page.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/cuenta/pedidos"
cat << 'LOTE5EOF' > "$REPO/app/cuenta/pedidos/page.tsx"
// app/cuenta/pedidos/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created:    { label: 'Creado',       color: '#999' },
  processing: { label: 'Procesando',   color: '#f59e0b' },
  shipped:    { label: 'Enviado',      color: '#3b82f6' },
  delivered:  { label: 'Entregado',    color: '#22c55e' },
  collected:  { label: 'Recogido',     color: '#22c55e' },
  cancelled:  { label: 'Cancelado',    color: '#ef4444' },
}

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let orders: any[] = []

  if (user) {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, status, created_at, pickup_code, shipping_method, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    orders = data ?? []
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>
        MIS PEDIDOS
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm mb-6" style={{ color: '#999' }}>
            Aún no tienes pedidos.
          </p>
          <Link href="/"
            className="font-display text-xs px-6 py-3"
            style={{ backgroundColor: '#FFF', color: '#000' }}>
            EXPLORAR STOCK
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.created
            const date = new Date(order.created_at).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', year: 'numeric'
            })
            return (
              <div key={order.id} className="p-4" style={{ border: '2px solid #FFFFFF' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>{order.order_number}</p>
                    <p className="font-meta text-xs" style={{ color: '#999' }}>{date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>
                      {Number(order.total).toFixed(2)} €
                    </p>
                    <span className="font-meta text-xs" style={{ color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {order.pickup_code && (
                  <div className="mb-3 p-3" style={{ border: '1px solid #F0E040', backgroundColor: 'rgba(240, 224, 64, 0.05)' }}>
                    <p className="font-meta text-xs" style={{ color: '#999' }}>CÓDIGO DE RECOGIDA</p>
                    <p className="font-display text-lg" style={{ color: '#F0E040', letterSpacing: '0.1em' }}>
                      {order.pickup_code}
                    </p>
                  </div>
                )}

                {order.payment_status === 'pending' && (
                  <p className="font-meta text-xs" style={{ color: '#f59e0b' }}>
                    Pago pendiente
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
LOTE5EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/cuenta/pedidos/page.tsx"

# ────────────────────────────────────────────────────
# Done!
# ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo " LOTE 5 COMPLETE — $COUNT/$TOTAL files written"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Files created:"
echo "  1. app/api/admin/reservations/route.ts"
echo "  2. app/admin/page.tsx"
echo "  3. app/admin/layout.tsx"
echo "  4. components/layout/Navigation.tsx"
echo "  5. app/cuenta/favoritos/BuyButton.tsx"
echo "  6. app/cuenta/favoritos/page.tsx"
echo "  7. context/CartContext.tsx"
echo "  8. components/cart/CartDrawer.tsx"
echo "  9. components/store/FavoriteButton.tsx"
echo " 10. components/store/RecordCard.tsx"
echo " 11. app/admin/orders/page.tsx"
echo " 12. app/admin/order/[id]/page.tsx"
echo " 13. app/cuenta/pedidos/page.tsx"
