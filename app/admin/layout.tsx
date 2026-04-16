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
