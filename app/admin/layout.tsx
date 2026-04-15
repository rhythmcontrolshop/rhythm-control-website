'use client'
import Link           from 'next/link'
import { useState }   from 'react'
import LogoutButton   from '@/components/admin/LogoutButton'

const NAV_LINKS = [
  { href: '/admin',              label: 'Dashboard'  },
  { href: '/admin/inventory',    label: 'Inventario' },
  { href: '/admin/codigos',      label: 'Códigos'    },
  { href: '/admin/pricing',      label: 'Precios'    },
  { href: '/admin/shipping',     label: 'Envíos'     },
  { href: '/admin/pedidos',      label: 'Pedidos'    },
  { href: '/admin/guardi',       label: 'Guardi'     },
  { href: '/admin/clientes',     label: 'Clientes'   },
  { href: '/admin/discogs',      label: 'Discogs'    },
  { href: '/admin/agenda',       label: 'Agenda'     },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div data-admin-theme style={{ minHeight: '100dvh', backgroundColor: '#FFFFFF' }}>
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-6"
        style={{
          height: '56px',
          borderBottom: '1px solid #d4d4d4',
          backgroundColor: '#FFFFFF',
          zIndex: 100,
        }}>
        <span className="font-display text-sm shrink-0" style={{ color: '#000000' }}>
          RHYTHM CONTROL <span style={{ color: '#6b7280' }}>/ ADMIN</span>
        </span>

        {/* Desktop nav — scrollable */}
        <div className="hidden lg:flex items-center gap-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className="text-xs transition-colors hover:text-black whitespace-nowrap"
              style={{ color: '#6b7280', fontFamily: 'var(--rc-font-mono)', letterSpacing: '0.07em' }}>
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-xs px-2 py-1"
            style={{ color: '#000000' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
          <LogoutButton />
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed top-[56px] left-0 right-0 z-50"
          style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #d4d4d4' }}>
          <div className="flex flex-col p-4 gap-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className="text-xs py-2 transition-colors hover:text-black"
                style={{ color: '#6b7280', fontFamily: 'var(--rc-font-mono)', letterSpacing: '0.07em' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingTop: '56px' }}>{children}</div>
    </div>
  )
}
