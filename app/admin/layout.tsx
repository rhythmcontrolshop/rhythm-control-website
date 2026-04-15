import Link         from 'next/link'
import LogoutButton from '@/components/admin/LogoutButton'
const NAV_LINKS = [
  { href: '/admin',              label: 'Dashboard'  },
  { href: '/admin/inventory',    label: 'Inventario' },
  { href: '/admin/reservations', label: 'Reservas'   },
  { href: '/admin/scan',         label: 'Escanear'   },
  { href: '/admin/events',       label: 'Eventos'    },
  { href: '/admin/orders',       label: 'Pedidos'    },
]
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--rc-color-bg)' }}>
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-6"
        style={{ height: 'var(--rc-nav-height)', borderBottom: 'var(--rc-border-main)',
                 backgroundColor: 'var(--rc-color-bg)', zIndex: 'var(--rc-z-nav)' as React.CSSProperties['zIndex'] }}>
        <span className="font-display text-sm" style={{ color: 'var(--rc-color-text)' }}>
          RHYTHM CONTROL <span style={{ color: 'var(--rc-color-accent)' }}>/ ADMIN</span>
        </span>
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="font-meta text-xs transition-colors"
              style={{ color: 'var(--rc-color-muted)' }}>{label}</Link>
          ))}
        </div>
        <LogoutButton />
      </nav>
      <div style={{ paddingTop: 'var(--rc-nav-height)' }}>{children}</div>
    </div>
  )
}
