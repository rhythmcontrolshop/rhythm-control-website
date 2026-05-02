'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'
import RhythmControlLogo from '@/components/ui/RhythmControlLogo'

const NO_NAV_PATHS = ['/admin/login', '/admin/recover', '/admin/reset-password', '/admin/setup']

// ─── Nav items grouped by section ──────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: 'GENERAL',
    items: [
      { href: '/admin',           label: 'Dashboard',   icon: '◉' },
    ],
  },
  {
    title: 'CATÁLOGO',
    items: [
      { href: '/admin/inventory', label: 'Inventario',  icon: '◼' },
      { href: '/admin/pricing',   label: 'Precios',     icon: '€' },
      { href: '/admin/codigos',   label: 'Códigos',     icon: '⌨' },
      { href: '/admin/discogs',   label: 'Discogs',     icon: '↔' },
    ],
  },
  {
    title: 'VENTA',
    items: [
      { href: '/admin/guardi',    label: 'Guardi',      icon: '⏐' },
      { href: '/admin/pedidos',   label: 'Pedidos',     icon: '☐' },
      { href: '/admin/facturas',  label: 'Facturas',    icon: '✎' },
      { href: '/admin/shipping',  label: 'Envíos',      icon: '→' },
      { href: '/admin/clientes',  label: 'Clientes',    icon: '☺' },
    ],
  },
  {
    title: 'TIENDA',
    items: [
      { href: '/admin/agenda',    label: 'Agenda',      icon: '◷' },
      { href: '/admin/equipo',    label: 'Equipo',      icon: '◇' },
      { href: '/admin/ajustes',   label: 'Ajustes',     icon: '⚙' },
    ],
  },
]

// Sidebar width constants
const SIDEBAR_W = '240px'
const TOPBAR_H = '48px'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = !NO_NAV_PATHS.some(p => pathname.startsWith(p))
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!showNav) return <>{children}</>

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#FAFAFA' }}>
      {/* ── Top bar (always visible) ───────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 md:px-6"
        style={{
          height: TOPBAR_H,
          borderBottom: '2px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          zIndex: 200,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center"
            style={{ width: '32px', height: '32px', color: '#374151', cursor: 'pointer' }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
          <Link href="/admin" className="flex items-center gap-2 group" style={{ textDecoration: 'none' }}>
            <RhythmControlLogo height="28px" fill="#000000" />
            <span style={{ color: '#6b7280', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: '400', fontSize: '0.6rem', letterSpacing: '0.05em' }}>/ ADMIN</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" target="_blank" className="text-xs hover:underline" style={{ color: '#6b7280', fontFamily: 'var(--rc-font-mono)', letterSpacing: '0.05em' }}>
            VER TIENDA →
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* ── Mobile overlay ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0" style={{ zIndex: 150 }}>
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute top-0 left-0 bottom-0 overflow-y-auto"
            style={{
              width: SIDEBAR_W,
              backgroundColor: '#FFFFFF',
              borderRight: '2px solid #E5E7EB',
              paddingTop: TOPBAR_H,
            }}
          >
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      <aside
        className="hidden md:block fixed top-0 left-0 bottom-0 overflow-y-auto"
        style={{
          width: SIDEBAR_W,
          backgroundColor: '#FFFFFF',
          borderRight: '2px solid #E5E7EB',
          paddingTop: TOPBAR_H,
          zIndex: 100,
        }}
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {/* ── Main content area ──────────────────────────────────────── */}
      <main
        className="md:ml-[240px]"
        style={{ paddingTop: TOPBAR_H }}
      >
        {children}
      </main>
    </div>
  )
}

// ─── Sidebar content (shared between mobile & desktop) ─────────────────────────
function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="py-4">
      {NAV_SECTIONS.map(section => (
        <div key={section.title} className="mb-4">
          <p className="px-4 py-2 text-[10px] font-bold tracking-widest" style={{ color: '#9CA3AF' }}>
            {section.title}
          </p>
          {section.items.map(item => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-3 px-4 py-2 text-xs transition-colors duration-150"
                style={{
                  color: isActive ? '#000000' : '#6b7280',
                  backgroundColor: isActive ? '#F3F4F6' : 'transparent',
                  fontFamily: 'var(--rc-font-mono)',
                  letterSpacing: '0.03em',
                  borderRight: isActive ? '3px solid #000000' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span className="text-sm" style={{ width: '16px', textAlign: 'center', opacity: 0.6 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
