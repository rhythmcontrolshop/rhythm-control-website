// components/layout/Navigation.tsx
// Barra de navegación principal. Fixed top, border-bottom 2px white.
// Logo izquierda · Links centro · Carrito derecha

import Link from 'next/link'

const NAV_LINKS = [
  { href: '/',          label: 'Catálogo'   },
  { href: '/events',    label: 'Eventos'    },
  { href: '/labels',    label: 'Sellos'     },
  { href: '/community', label: 'Comunidad'  },
]

export default function Navigation() {
  return (
    <header
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 md:px-6"
      style={{
        height:          'var(--rc-nav-height)',
        backgroundColor: 'var(--rc-color-bg)',
        borderBottom:    'var(--rc-border-main)',
        zIndex:          'var(--rc-z-nav)' as React.CSSProperties['zIndex'],
      }}
    >
      {/* Logo */}
      <Link href="/" className="font-display text-sm md:text-base shrink-0" style={{ color: 'var(--rc-color-text)' }}>
        RHYTHM CONTROL
      </Link>

      {/* Links — solo desktop */}
      <nav className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="font-meta text-xs transition-colors hover:text-white"
            style={{ color: 'var(--rc-color-muted)' }}
          >
            {label.toUpperCase()}
          </Link>
        ))}
      </nav>

      {/* Carrito */}
      <button
        className="font-meta text-xs transition-colors hover:text-white"
        style={{ color: 'var(--rc-color-text)' }}
        aria-label="Carrito de compra"
      >
        CARRITO (0)
      </button>
    </header>
  )
}
