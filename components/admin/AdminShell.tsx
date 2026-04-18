'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'
import RhythmControlLogo from '@/components/ui/RhythmControlLogo'

const NO_NAV_PATHS = ['/admin/login', '/admin/recover', '/admin/reset-password']

const NAV_LINKS = [
  { href: '/admin',           label: 'Dashboard'  },
  { href: '/admin/inventory', label: 'Inventario' },
  { href: '/admin/pricing',   label: 'Precios'    },
  { href: '/admin/shipping',  label: 'Envíos'     },
  { href: '/admin/guardi',    label: 'Guardi'     },
  { href: '/admin/codigos',   label: 'Códigos'    },
  { href: '/admin/pedidos',   label: 'Pedidos'    },
  { href: '/admin/clientes',  label: 'Clientes'   },
  { href: '/admin/discogs',   label: 'Discogs'    },
  { href: '/admin/agenda',    label: 'Agenda'     },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = !NO_NAV_PATHS.some(p => pathname.startsWith(p))

  return (
    <>
      {showNav && (
        <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 md:px-6"
          style={{
            height: '56px',
            borderBottom: '2px solid #000000',
            backgroundColor: '#FFFFFF',
            zIndex: 100,
          }}>
          <Link href="/" className="flex items-center group relative" style={{ textDecoration: 'none', height: '40px', overflow: 'visible' }}>
            <div className="flex items-center gap-2">
              <div className="transition-opacity duration-200 group-hover:opacity-0" style={{ lineHeight: 0 }}>
                <RhythmControlLogo height="32px" fill="#000000" />
              </div>
              <span className="transition-opacity duration-200 group-hover:opacity-0" style={{ color: '#6b7280', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: '400', fontSize: '0.65rem', letterSpacing: '0.05em' }}>/ ADMIN</span>
            </div>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
              style={{ color: '#000000', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: '900', fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: '1' }}>
              BARCELONA
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs transition-colors hover:text-black"
                style={{ color: '#6b7280', fontFamily: 'var(--rc-font-mono)', letterSpacing: '0.05em' }}>{label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile nav toggle */}
            <MobileNav />
            <LogoutButton />
          </div>
        </nav>
      )}
      <div style={{ paddingTop: showNav ? '56px' : '0' }}>{children}</div>
    </>
  )
}

function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="text-xs font-display px-2 py-1" style={{ border: '1px solid #d1d5db', color: '#374151', cursor: 'pointer' }}>
        {open ? '✕' : '☰'}
      </button>
      {open && (
        // E3-26: Backdrop + body scroll lock for mobile menu
        <>
          <div className="fixed inset-0 bg-black/30 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute top-[56px] left-0 right-0 p-4 space-y-3 z-[101]" style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid #000000' }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="block text-xs transition-colors hover:text-black min-h-[44px] flex items-center"
                style={{ color: '#374151', fontFamily: 'var(--rc-font-mono)', letterSpacing: '0.05em' }}>{label}</Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
