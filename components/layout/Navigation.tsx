'use client'
// components/layout/Navigation.tsx
// Barra de navegación con menú hamburguesa en móvil.

import { useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/',          label: 'Catálogo'   },
  { href: '/events',    label: 'Eventos'    },
  { href: '/labels',    label: 'Sellos'     },
  { href: '/community', label: 'Comunidad'  },
]

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 md:px-6"
        style={{
          height:          'var(--rc-nav-height)',
          backgroundColor: '#000000',
          borderBottom:    '2px solid #FFFFFF',
          zIndex:          100,
        }}
      >
        {/* Hamburguesa - solo móvil */}
        <button
          className="md:hidden flex flex-col justify-center items-center"
          style={{ width: '32px', height: '32px' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span
            style={{
              display: 'block',
              width:  '20px',
              height: '2px',
              backgroundColor: menuOpen ? '#F0E040' : '#FFFFFF',
              transition: 'transform 0.2s, opacity 0.2s',
              transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
            }}
          />
          <span
            style={{
              display: 'block',
              width:  '20px',
              height: '2px',
              backgroundColor: '#FFFFFF',
              margin: '4px 0',
              opacity: menuOpen ? 0 : 1,
              transition: 'opacity 0.2s',
            }}
          />
          <span
            style={{
              display: 'block',
              width:  '20px',
              height: '2px',
              backgroundColor: menuOpen ? '#F0E040' : '#FFFFFF',
              transition: 'transform 0.2s',
              transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
            }}
          />
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="font-display text-sm md:text-base shrink-0"
          style={{ color: '#FFFFFF' }}
          onClick={() => setMenuOpen(false)}
        >
          RHYTHM CONTROL
        </Link>

        {/* Links — solo desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-meta text-xs transition-colors hover:opacity-70"
              style={{ color: '#FFFFFF' }}
            >
              {label.toUpperCase()}
            </Link>
          ))}
        </nav>

        {/* Carrito */}
        <button
          className="font-meta text-xs transition-colors hover:opacity-70"
          style={{ color: '#FFFFFF' }}
          aria-label="Carrito de compra"
        >
          CARRITO (0)
        </button>
      </header>

      {/* Overlay del menú móvil */}
      {menuOpen && (
        <div
          className="fixed inset-0 md:hidden"
          style={{
            top:          'var(--rc-nav-height)',
            backgroundColor: '#000000',
            zIndex:       99,
            borderLeft:   '2px solid #FFFFFF',
            borderRight:  '2px solid #FFFFFF',
            borderBottom: '2px solid #FFFFFF',
          }}
        >
          <nav className="flex flex-col">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-display text-lg px-6 py-5 transition-colors"
                style={{
                  color: '#FFFFFF',
                  borderBottom: '1px solid #1C1C1C',
                }}
                onClick={() => setMenuOpen(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F0E040'
                  e.currentTarget.style.color = '#000000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#FFFFFF'
                }}
              >
                {label.toUpperCase()}
              </Link>
            ))}
          </nav>

          {/* Info adicional en menú móvil */}
          <div className="p-6 mt-4" style={{ borderTop: '2px solid #FFFFFF' }}>
            <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
              Tienda de discos en Barcelona
            </p>
            <p className="font-meta text-xs mt-2" style={{ color: '#F0E040' }}>
              info@rhythmcontrol.es
            </p>
          </div>
        </div>
      )}
    </>
  )
}
