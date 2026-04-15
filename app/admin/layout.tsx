import Link         from 'next/link'
import LogoutButton from '@/components/admin/LogoutButton'
const NAV_LINKS = [
  { href: '/admin',              label: 'Dashboard'  },
  { href: '/admin/inventory',    label: 'Inventario' },
  { href: '/admin/pricing',      label: 'Precios'    },
  { href: '/admin/shipping',     label: 'Envíos'     },
  { href: '/admin/reservations', label: 'Reservas'   },
  { href: '/admin/scan',         label: 'Escanear'   },
  { href: '/admin/events',       label: 'Eventos'    },
  { href: '/admin/orders',       label: 'Pedidos'    },
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
        <span className="font-display text-sm" style={{ color: '#000000' }}>
          RHYTHM CONTROL <span style={{ color: '#6b7280' }}>/ ADMIN</span>
        </span>
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
