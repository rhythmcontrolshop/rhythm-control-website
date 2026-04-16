#!/bin/bash
set -e
PROJECT="${1:-.}"
echo "=== LOTE 7 — RHYTHM CONTROL ==="
echo "Project: $PROJECT"
echo ""

# 1. app/page.tsx
mkdir -p "$PROJECT/app"
cat > "$PROJECT/app/page.tsx" << 'ENDOFFILE'
import Navigation    from '@/components/layout/Navigation'
import Hero          from '@/components/home/Hero'
import CatalogueView from '@/components/store/CatalogueView'
import StrobeDots    from '@/components/ui/StrobeDots'
import Footer        from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import type { Release } from '@/types'

async function getInitialData(): Promise<{ releases: Release[]; total: number; genres: string[] }> {
  try {
    const supabase = await createClient()
    const { data, error, count } = await supabase.from('releases').select('*', { count: 'exact' }).eq('status', 'active').order('created_at', { ascending: false }).limit(24)
    if (error) return { releases: [], total: 0, genres: [] }
    const genreSet = new Set<string>()
    ;(data ?? []).forEach(r => r.genres?.forEach((g: string) => genreSet.add(g)))
    return { releases: data ?? [], total: count ?? 0, genres: Array.from(genreSet).sort() }
  } catch { return { releases: [], total: 0, genres: [] } }
}

export default async function Home() {
  const { releases, total, genres } = await getInitialData()

  return (
    <>
      <Navigation />
      <main style={{ minHeight: '100vh', backgroundColor: '#000000' }}>

        {/* Hero Section — TOP / MIX / AGENDA */}
        <Hero releases={releases} />

        {/* Catalogue Content + Pagination */}
        <CatalogueView initialReleases={releases} initialTotal={total} genres={genres} />

        {/* Spacer between pagination and animation */}
        <div style={{ height: '48px' }} />

        {/* Animation Separator */}
        <StrobeDots />

      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}
ENDOFFILE
echo "✓ app/page.tsx"

# 2. app/stock/page.tsx
mkdir -p "$PROJECT/app/stock"
cat > "$PROJECT/app/stock/page.tsx" << 'ENDOFFILE'
import Navigation    from '@/components/layout/Navigation'
import CatalogueView from '@/components/store/CatalogueView'
import StrobeDots    from '@/components/ui/StrobeDots'
import Footer        from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import type { Release } from '@/types'

async function getInitialData(): Promise<{ releases: Release[]; total: number; genres: string[] }> {
  try {
    const supabase = await createClient()
    const { data, error, count } = await supabase.from('releases').select('*', { count: 'exact' }).eq('status', 'active').order('created_at', { ascending: false }).limit(24)
    if (error) return { releases: [], total: 0, genres: [] }
    const genreSet = new Set<string>()
    ;(data ?? []).forEach(r => r.genres?.forEach((g: string) => genreSet.add(g)))
    return { releases: data ?? [], total: count ?? 0, genres: Array.from(genreSet).sort() }
  } catch { return { releases: [], total: 0, genres: [] } }
}

export default async function StockPage() {
  const { releases, total, genres } = await getInitialData()

  return (
    <>
      <Navigation />
      <main style={{ minHeight: '100vh', backgroundColor: '#000000' }}>

        {/* STOCK Title — centered, big */}
        <div className="flex items-center justify-center" style={{ borderTop: '2px solid #FFFFFF', borderBottom: '2px solid #FFFFFF', padding: '24px' }}>
          <h2 className="font-display text-center" style={{ color: '#FFFFFF', fontSize: 'clamp(3.5rem, 8.4vw, 7rem)', lineHeight: '1' }}>
            STOCK
          </h2>
        </div>

        {/* Catalogue Content + Pagination */}
        <CatalogueView initialReleases={releases} initialTotal={total} genres={genres} />

        {/* Spacer between pagination and animation */}
        <div style={{ height: '48px' }} />

        {/* Animation Separator */}
        <StrobeDots />

      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}
ENDOFFILE
echo "✓ app/stock/page.tsx"

# 3. components/layout/Navigation.tsx
mkdir -p "$PROJECT/components/layout"
cat > "$PROJECT/components/layout/Navigation.tsx" << 'ENDOFFILE'
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
    { href: '/stock',     label: 'STOCK' },
    { href: '/contacto',  label: t('nav.contact')  },
  ]

  return (
    <header style={{ backgroundColor: bgColor, borderBottom: `2px solid ${borderColor}` }}>
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between" style={{ height: '120px', padding: '0 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', position: 'relative' }} className="group">
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
ENDOFFILE
echo "✓ components/layout/Navigation.tsx"

echo ""
echo "=== LOTE 7 files 1-3 written ==="

# 4. components/layout/Footer.tsx
mkdir -p "$PROJECT/components/layout"
cat > "$PROJECT/components/layout/Footer.tsx" << 'ENDOFFILE'
import Link from 'next/link'

interface FooterProps {
  variant?: 'yellow' | 'magenta' | 'green'
}

export default function Footer({ variant = 'yellow' }: FooterProps) {
  const bgColor = variant === 'magenta' ? '#FF00FF' : variant === 'green' ? '#77DD77' : '#F0E040'
  const borderColor = '#000000'
  const textColor = '#000000'

  return (
    <footer style={{ backgroundColor: bgColor, borderTop: `2px solid ${borderColor}` }}>
      <div className="grid grid-cols-2 md:grid-cols-6" style={{ minHeight: '120px' }}>
        
        <div className="col-span-2 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <h3 className="font-display text-2xl" style={{ color: textColor }}>RHYTHM CONTROL</h3>
          <p className="font-mono text-xs mt-2" style={{ color: textColor }}>
            Rda. de Sant Pau, 19-21, Local 28<br />
            Eixample, 08015 Barcelona<br />
            LUN - SAB: 11:00 - 20:00
          </p>
        </div>

        <div className="col-span-1 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <nav className="flex flex-col gap-2">
            <Link href="/stock" className="font-display text-xs hover:underline" style={{ color: textColor, cursor: 'pointer' }}>STOCK</Link>
            <Link href="/novedades" className="font-display text-xs hover:underline" style={{ color: textColor, cursor: 'pointer' }}>NOVEDADES</Link>
            <Link href="/contacto" className="font-display text-xs hover:underline" style={{ color: textColor, cursor: 'pointer' }}>CONTACTO</Link>
          </nav>
        </div>

        <div className="col-span-1 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
           <nav className="flex flex-col gap-2">
            <a href="https://instagram.com/rhythmcontrol.bcn" target="_blank" className="font-display text-xs hover:underline" style={{ color: textColor }}>INSTAGRAM →</a>
            <a href="https://mixcloud.com/rhythmcontrolshop" target="_blank" className="font-display text-xs hover:underline" style={{ color: textColor }}>MIXCLOUD →</a>
          </nav>
        </div>

        <div className="col-span-2 p-6 flex flex-col justify-between">
          <div>
            <p className="font-display text-xs" style={{ color: textColor }}>NEWSLETTER</p>
            <div className="flex mt-2">
              <input 
                type="email" 
                placeholder="EMAIL" 
                className="w-full p-2 font-mono text-xs placeholder:text-gray-400"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', border: 'none', outline: 'none' }}
              />
              <button className="px-3 font-display text-xs shrink-0"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}>
                →
              </button>
            </div>
          </div>
          <p className="font-mono text-[10px] mt-4" style={{ color: textColor }}>
            © 2026 RHYTHM CONTROL. ALL RIGHTS RESERVED.
          </p>
        </div>

      </div>
    </footer>
  )
}
ENDOFFILE
echo "✓ components/layout/Footer.tsx"


# 5. app/admin/page.tsx
mkdir -p "$PROJECT/app/admin"
cat > "$PROJECT/app/admin/page.tsx" << 'ENDOFFILE'
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
          <InventoryButton href="/admin/orders" label="HOY" count={todayOrders} />
          <InventoryButton href="/admin/orders" label="TOTAL" count={totalOrders} />
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

function InventoryButton({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link href={href}
      className="flex flex-col items-center justify-center p-8 transition-colors duration-200"
      style={{ border: '2px solid #000000', backgroundColor: '#FFFFFF', color: '#000000', textDecoration: 'none', minHeight: '140px' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#FFFFFF' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#000000' }}>
      <span className="text-xs font-medium tracking-widest mb-3 opacity-70">{label}</span>
      <span className="text-5xl font-bold tabular-nums">{count}</span>
    </Link>
  )
}

function QuickLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <Link href={href} target={external ? '_blank' : undefined}
      className="text-xs px-6 py-3 text-center tracking-widest font-medium transition-colors duration-200"
      style={{ border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none', backgroundColor: '#FFFFFF' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#000000' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#d1d5db' }}>
      {label}
    </Link>
  )
}
ENDOFFILE
echo "✓ app/admin/page.tsx"


# 6. app/cuenta/layout.tsx
mkdir -p "$PROJECT/app/cuenta"
cat > "$PROJECT/app/cuenta/layout.tsx" << 'ENDOFFILE'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/cuenta')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#000000' }}>
      {/* Minimal nav — logo + logout only, no sub-navigation */}
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-6"
        style={{ height: '72px', borderBottom: '2px solid #FFFFFF', backgroundColor: '#000000', zIndex: 100 }}>
        <Link href="/" className="font-display" style={{ color: '#FFFFFF', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', textDecoration: 'none', lineHeight: '1' }}>
          RHYTHM CONTROL
        </Link>
        <LogoutButton />
      </nav>

      <div style={{ paddingTop: '72px' }}>
        {children}
      </div>
    </div>
  )
}
ENDOFFILE
echo "✓ app/cuenta/layout.tsx"

# 7. app/cuenta/LogoutButton.tsx
mkdir -p "$PROJECT/app/cuenta"
cat > "$PROJECT/app/cuenta/LogoutButton.tsx" << 'ENDOFFILE'
'use client'
import { logout } from './actions'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="font-display text-xs px-5 py-2 tracking-widest transition-colors duration-200"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#000000',
          border: '2px solid #000000',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}
      >
        SALIR
      </button>
    </form>
  )
}
ENDOFFILE
echo "✓ app/cuenta/LogoutButton.tsx"

# 8. app/cuenta/page.tsx
mkdir -p "$PROJECT/app/cuenta"
cat > "$PROJECT/app/cuenta/page.tsx" << 'ENDOFFILE'
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
ENDOFFILE
echo "✓ app/cuenta/page.tsx"

# 9. app/cuenta/favoritos/page.tsx
mkdir -p "$PROJECT/app/cuenta/favoritos"
cat > "$PROJECT/app/cuenta/favoritos/page.tsx" << 'ENDOFFILE'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import RemoveFavorite from './RemoveFavorite'
import BuyButton from './BuyButton'

export default async function FavoritosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Step 1: Fetch wantlist items (stored data: title, artists, cover_image)
  const { data: favorites } = await supabase
    .from('wantlist')
    .select('id, added_at, discogs_release_id, title, artists, cover_image')
    .eq('user_id', user!.id)
    .order('added_at', { ascending: false })

  // Step 2: Fetch live release data by discogs_release_id for current status/price
  const discogsIds = (favorites ?? []).map(f => f.discogs_release_id).filter(Boolean)
  let releaseMap = new Map<number, any>()

  if (discogsIds.length > 0) {
    const { data: releases } = await supabase
      .from('releases')
      .select('id, discogs_release_id, title, artists, cover_image, price, status, condition, format, labels, discogs_listing_id')
      .in('discogs_release_id', discogsIds)
    ;(releases ?? []).forEach(r => {
      if (r.discogs_release_id) releaseMap.set(r.discogs_release_id, r)
    })
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>MIS FAVORITOS</h1>

      {(!favorites || favorites.length === 0) ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>Tu lista de favoritos está vacía.</p>
          <a href="/stock" className="inline-block mt-6 font-display text-xs px-6 py-3 transition-colors duration-200"
            style={{ backgroundColor: '#FFFFFF', color: '#000000', border: '2px solid #000000', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}>EXPLORAR STOCK</a>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav: any) => {
            // Use live release data when available, fall back to stored wantlist data
            const liveRelease = fav.discogs_release_id ? releaseMap.get(fav.discogs_release_id) : null
            const displayTitle = liveRelease?.title || fav.title || '—'
            const displayArtist = (liveRelease?.artists || fav.artists || [])[0] || '—'
            const displayCover = liveRelease?.cover_image || fav.cover_image || ''
            const displayPrice = liveRelease?.price
            const isAvailable = liveRelease ? liveRelease.status === 'active' : false

            return (
              <div key={fav.id} className="flex gap-4 p-4" style={{ border: '2px solid #FFFFFF' }}>
                <div className="w-20 h-20 shrink-0 relative" style={{ border: '1px solid #333' }}>
                  {displayCover ? (
                    <Image src={displayCover} alt={displayTitle} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{displayArtist}</p>
                  <p className="font-display text-sm" style={{ color: '#F0E040' }}>{displayTitle}</p>
                  {displayPrice != null && (
                    <p className="font-meta text-xs mt-1" style={{ color: '#FFFFFF' }}>{Number(displayPrice).toFixed(2)} €</p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <span className="font-meta text-xs px-2 py-1"
                    style={{ border: isAvailable ? '1px solid #22c55e' : '1px solid #ef4444', color: isAvailable ? '#22c55e' : '#ef4444' }}>
                    {isAvailable ? 'DISPONIBLE' : (liveRelease ? 'VENDIDO' : 'N/A')}
                  </span>
                  {isAvailable && liveRelease && <BuyButton release={liveRelease} />}
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
ENDOFFILE
echo "✓ app/cuenta/favoritos/page.tsx"

# 10. app/cuenta/favoritos/BuyButton.tsx
mkdir -p "$PROJECT/app/cuenta/favoritos"
cat > "$PROJECT/app/cuenta/favoritos/BuyButton.tsx" << 'ENDOFFILE'
'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import type { Release } from '@/types'

export default function BuyButton({ release }: { release: any }) {
  const { addItem, openCart } = useCart()
  const [added, setAdded] = useState(false)

  function handleBuy() {
    const item: Partial<Release> & { quantity: number } = {
      id: release.id, title: release.title, artists: release.artists ?? [],
      price: release.price ?? 0, cover_image: release.cover_image ?? '',
      condition: release.condition ?? '', format: release.format ?? '',
      labels: release.labels ?? [], discogs_listing_id: release.discogs_listing_id ?? 0,
      quantity: 1,
    }
    addItem(item as any)
    openCart()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button onClick={handleBuy}
      className="font-display text-xs px-4 py-2 transition-colors duration-200"
      style={{
        backgroundColor: added ? '#F0E040' : '#FFFFFF',
        color: '#000000',
        border: '2px solid #000000',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { if (!added) e.currentTarget.style.backgroundColor = '#F0E040' }}
      onMouseLeave={e => { if (!added) e.currentTarget.style.backgroundColor = '#FFFFFF' }}>
      {added ? 'AÑADIDO ✓' : 'COMPRAR'}
    </button>
  )
}
ENDOFFILE
echo "✓ app/cuenta/favoritos/BuyButton.tsx"

# 11. app/cuenta/favoritos/RemoveFavorite.tsx
mkdir -p "$PROJECT/app/cuenta/favoritos"
cat > "$PROJECT/app/cuenta/favoritos/RemoveFavorite.tsx" << 'ENDOFFILE'
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RemoveFavorite({ favoriteId }: { favoriteId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function remove() {
    setLoading(true)
    await fetch('/api/cuenta/favoritos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: favoriteId })
    })
    router.refresh()
  }

  return (
    <button onClick={remove} disabled={loading}
      className="font-meta text-xs px-4 py-2 transition-colors duration-200"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#000000',
        border: '2px solid #000000',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#F0E040' }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#FFFFFF' }}>
      {loading ? '...' : 'ELIMINAR'}
    </button>
  )
}
ENDOFFILE
echo "✓ app/cuenta/favoritos/RemoveFavorite.tsx"

# 12. app/cuenta/pedidos/page.tsx
mkdir -p "$PROJECT/app/cuenta/pedidos"
cat > "$PROJECT/app/cuenta/pedidos/page.tsx" << 'ENDOFFILE'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created:    { label: 'Creado',     color: '#999' },
  processing: { label: 'Procesando', color: '#f59e0b' },
  shipped:    { label: 'Enviado',    color: '#3b82f6' },
  delivered:  { label: 'Entregado',  color: '#22c55e' },
  collected:  { label: 'Recogido',   color: '#22c55e' },
  cancelled:  { label: 'Cancelado',  color: '#ef4444' },
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
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>MIS PEDIDOS</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm mb-6" style={{ color: '#999' }}>Aún no tienes pedidos.</p>
          <Link href="/stock" className="font-display text-xs px-6 py-3 transition-colors duration-200 inline-block"
            style={{ backgroundColor: '#FFFFFF', color: '#000000', border: '2px solid #000000', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}>EXPLORAR STOCK</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.created
            const date = new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <div key={order.id} className="p-4" style={{ border: '2px solid #FFFFFF' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>{order.order_number}</p>
                    <p className="font-meta text-xs" style={{ color: '#999' }}>{date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg" style={{ color: '#FFFFFF' }}>{Number(order.total).toFixed(2)} €</p>
                    <span className="font-meta text-xs" style={{ color: st.color }}>{st.label}</span>
                  </div>
                </div>
                {order.pickup_code && (
                  <div className="mb-3 p-3" style={{ border: '1px solid #F0E040', backgroundColor: 'rgba(240, 224, 64, 0.05)' }}>
                    <p className="font-meta text-xs" style={{ color: '#999' }}>CÓDIGO DE RECOGIDA</p>
                    <p className="font-display text-lg" style={{ color: '#F0E040', letterSpacing: '0.1em' }}>{order.pickup_code}</p>
                  </div>
                )}
                {order.payment_status === 'pending' && (
                  <p className="font-meta text-xs" style={{ color: '#f59e0b' }}>Pago pendiente</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
ENDOFFILE
echo "✓ app/cuenta/pedidos/page.tsx"

# 13. app/cuenta/datos/page.tsx
mkdir -p "$PROJECT/app/cuenta/datos"
cat > "$PROJECT/app/cuenta/datos/page.tsx" << 'ENDOFFILE'
import { createClient } from '@/lib/supabase/server'
import UpdateProfileForm from './UpdateProfileForm'
import ShippingAddressForm from './ShippingAddressForm'

export default async function DatosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>MIS DATOS</h1>
      <div className="space-y-8">
        <section>
          <p className="font-meta text-xs mb-4" style={{ color: '#FFFFFF' }}>DATOS PERSONALES</p>
          <UpdateProfileForm profile={profile} />
        </section>
        <hr style={{ border: 'none', borderTop: '1px solid #333' }} />
        <section>
          <p className="font-meta text-xs mb-4" style={{ color: '#FFFFFF' }}>DIRECCIÓN DE ENVÍO</p>
          <ShippingAddressForm profile={profile} />
        </section>
      </div>
    </div>
  )
}
ENDOFFILE
echo "✓ app/cuenta/datos/page.tsx"

# 14. app/cuenta/datos/UpdateProfileForm.tsx
mkdir -p "$PROJECT/app/cuenta/datos"
cat > "$PROJECT/app/cuenta/datos/UpdateProfileForm.tsx" << 'ENDOFFILE'
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string; email: string; username?: string | null; first_name?: string | null;
  last_name?: string | null; full_name?: string | null; tax_id?: string | null;
}

export default function UpdateProfileForm({ profile }: { profile: Profile | null }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const hasData = profile?.first_name || profile?.last_name

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setSaved(false)
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/cuenta/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'personal', username: form.get('username'), first_name: form.get('first_name'), last_name: form.get('last_name'), nif: form.get('nif') })
    })
    setLoading(false)
    if (res.ok) { setSaved(true); setEditing(false); router.refresh() }
  }

  if (!editing && hasData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><p className="font-meta text-xs mb-1" style={{ color: '#888' }}>NOMBRE</p><p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{profile?.first_name || '-'}</p></div>
          <div><p className="font-meta text-xs mb-1" style={{ color: '#888' }}>APELLIDOS</p><p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{profile?.last_name || '-'}</p></div>
        </div>
        <div><p className="font-meta text-xs mb-1" style={{ color: '#888' }}>EMAIL</p><p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{profile?.email}</p></div>
        <div><p className="font-meta text-xs mb-1" style={{ color: '#888' }}>NIF / DNI</p><p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{profile?.tax_id || '-'}</p></div>
        <button onClick={() => setEditing(true)}
          className="font-display text-sm px-6 py-3 transition-colors duration-200"
          style={{ backgroundColor: '#FFFFFF', color: '#000000', border: '2px solid #000000', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}>EDITAR DATOS</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>EMAIL</label>
        <input type="email" value={profile?.email || ''} disabled className="w-full bg-transparent font-meta text-sm px-4 py-3 opacity-50 cursor-not-allowed" style={{ border: '2px solid #333', color: '#FFFFFF' }} /></div>
      <div><label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>NOMBRE DE USUARIO</label>
        <input name="username" type="text" defaultValue={profile?.username || ''} className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none" style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }} placeholder="Tu nombre público" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>NOMBRE *</label>
          <input name="first_name" type="text" required defaultValue={profile?.first_name || ''} className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none" style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }} placeholder="Juan" /></div>
        <div><label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>APELLIDOS *</label>
          <input name="last_name" type="text" required defaultValue={profile?.last_name || ''} className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none" style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }} placeholder="Pérez García" /></div>
      </div>
      <div><label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>NIF / DNI (opcional)</label>
        <input name="nif" type="text" defaultValue={profile?.tax_id || ''} className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none" style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }} placeholder="12345678A" /></div>
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading}
          className="font-display text-sm px-6 py-3 transition-colors duration-200"
          style={{ backgroundColor: '#FFFFFF', color: '#000000', border: '2px solid #000000', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#F0E040' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#FFFFFF' }}>{loading ? 'GUARDANDO...' : 'GUARDAR'}</button>
        {hasData && <button type="button" onClick={() => setEditing(false)} className="font-meta text-sm px-4 py-2" style={{ color: '#888' }}>Cancelar</button>}
        {saved && <p className="font-meta text-xs" style={{ color: '#22c55e' }}>Guardado correctamente</p>}
      </div>
    </form>
  )
}
ENDOFFILE
echo "✓ app/cuenta/datos/UpdateProfileForm.tsx"

# 15. app/cuenta/datos/ShippingAddressForm.tsx
mkdir -p "$PROJECT/app/cuenta/datos"
cat > "$PROJECT/app/cuenta/datos/ShippingAddressForm.tsx" << 'ENDOFFILE'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  phone?: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
  province?: string | null
  country_code?: string | null
}

const PROVINCES_ES: Record<string, string> = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería',
  '05': 'Ávila', '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona',
  '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón',
  '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16': 'Cuenca',
  '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Guipúzcoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León',
  '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid',
  '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
  '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra',
  '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria',
  '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona',
  '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid',
  '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'
}

const COUNTRIES: Record<string, string> = {
  ES: 'España', PT: 'Portugal', FR: 'Francia', IT: 'Italia',
  DE: 'Alemania', GB: 'Reino Unido', NL: 'Países Bajos',
  BE: 'Bélgica', AT: 'Austria', IE: 'Irlanda'
}

function validatePhone(phone: string): { valid: boolean; formatted: string; error?: string } {
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '')
  
  if (cleaned.startsWith('+34')) {
    const num = cleaned.slice(3)
    if (/^[6789]\d{8}$/.test(num)) {
      return { valid: true, formatted: `+34${num}` }
    }
    return { valid: false, formatted: phone, error: 'Teléfono español inválido' }
  }
  
  if (/^[6789]\d{8}$/.test(cleaned)) {
    return { valid: true, formatted: `+34${cleaned}` }
  }
  
  if (/^\+\d{7,15}$/.test(cleaned)) {
    return { valid: true, formatted: cleaned }
  }
  
  return { valid: false, formatted: phone, error: 'Formato: +34600123456 o 600123456' }
}

function validatePostalCode(code: string, countryCode: string): { valid: boolean; error?: string } {
  const patterns: Record<string, RegExp> = {
    ES: /^\d{5}$/,
    PT: /^\d{4}(-\d{3})?$/,
    FR: /^\d{5}$/,
    DE: /^\d{5}$/,
    IT: /^\d{5}$/,
    GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    NL: /^\d{4}[A-Z]{2}$/i,
    BE: /^\d{4}$/,
    AT: /^\d{4}$/,
    IE: /^[A-Z]\d{2}[A-Z]{0,2}$/i
  }
  
  const pattern = patterns[countryCode]
  if (!pattern) return { valid: true }
  
  if (!pattern.test(code)) {
    return { valid: false, error: `Código postal inválido para ${COUNTRIES[countryCode] || countryCode}` }
  }
  return { valid: true }
}

export default function ShippingAddressForm({ profile }: { profile: Profile | null }) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setApiError(null)
    setErrors({})

    const form = new FormData(e.currentTarget)
    const phone = form.get('phone') as string
    const postalCode = form.get('postal_code') as string
    const countryCode = form.get('country_code') as string

    const newErrors: Record<string, string> = {}
    
    if (phone) {
      const phoneResult = validatePhone(phone)
      if (!phoneResult.valid) newErrors.phone = phoneResult.error!
    }
    
    if (postalCode) {
      const cpResult = validatePostalCode(postalCode, countryCode)
      if (!cpResult.valid) newErrors.postal_code = cpResult.error!
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    const formattedPhone = phone ? validatePhone(phone).formatted : null

    try {
      const res = await fetch('/api/cuenta/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'shipping',
          phone: formattedPhone,
          address: form.get('address'),
          postal_code: form.get('postal_code'),
          city: form.get('city'),
          province: countryCode === 'ES' ? form.get('province') : null,
          country_code: countryCode
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setApiError(data.error || 'Error al guardar')
        setLoading(false)
        return
      }

      setSaved(true)
      router.refresh()
    } catch (err) {
      setApiError('Error de conexión')
    }
    
    setLoading(false)
  }

  const currentCountry = profile?.country_code || 'ES'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            TELÉFONO
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={profile?.phone || ''}
            className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: `2px solid ${errors.phone ? '#ef4444' : '#FFFFFF'}`, color: '#FFFFFF' }}
            placeholder="+34 600 123 456"
          />
          {errors.phone && (
            <p className="font-meta text-xs mt-1" style={{ color: '#ef4444' }}>{errors.phone}</p>
          )}
        </div>
        
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            PAÍS
          </label>
          <select
            name="country_code"
            defaultValue={currentCountry}
            className="w-full bg-black font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
          >
            {Object.entries(COUNTRIES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
          DIRECCIÓN
        </label>
        <input
          name="address"
          type="text"
          defaultValue={profile?.address || ''}
          className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
          style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
          placeholder="Calle, número, piso, puerta"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            CÓDIGO POSTAL
          </label>
          <input
            name="postal_code"
            type="text"
            defaultValue={profile?.postal_code || ''}
            className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: `2px solid ${errors.postal_code ? '#ef4444' : '#FFFFFF'}`, color: '#FFFFFF' }}
            placeholder="08001"
          />
          {errors.postal_code && (
            <p className="font-meta text-xs mt-1" style={{ color: '#ef4444' }}>{errors.postal_code}</p>
          )}
        </div>
        
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            CIUDAD
          </label>
          <input
            name="city"
            type="text"
            defaultValue={profile?.city || ''}
            className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
            placeholder="Barcelona"
          />
        </div>

        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            PROVINCIA
          </label>
          <select
            name="province"
            defaultValue={profile?.province || ''}
            className="w-full bg-black font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
          >
            <option value="">Seleccionar...</option>
            {Object.entries(PROVINCES_ES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {apiError && (
        <p className="font-meta text-xs" style={{ color: '#ef4444' }}>{apiError}</p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="font-display text-sm px-6 py-3 transition-colors duration-200"
          style={{ backgroundColor: '#FFFFFF', color: '#000000', border: '2px solid #000000', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#F0E040' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#FFFFFF' }}
        >
          {loading ? 'GUARDANDO...' : 'GUARDAR DIRECCIÓN'}
        </button>
        {saved && (
          <p className="font-meta text-xs" style={{ color: '#22c55e' }}>
            Dirección guardada
          </p>
        )}
      </div>
    </form>
  )
}
ENDOFFILE
echo "✓ app/cuenta/datos/ShippingAddressForm.tsx"

echo ""
echo "=== LOTE 7 completo: 15 archivos escritos ==="
