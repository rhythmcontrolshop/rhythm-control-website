'use client'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

const NAV_LINKS = [
  { href: '/novedades', label: 'NOVEDADES' },
  { href: '/',          label: 'CATÁLOGO'  },
  { href: '/contacto',  label: 'CONTACTO'  },
]

interface NavigationProps {
  variant?: 'default' | 'magenta'
}

export default function Navigation({ variant = 'default' }: NavigationProps) {
  const isMagenta = variant === 'magenta'
  const bgColor = isMagenta ? '#FF00FF' : '#000000'
  const textColor = isMagenta ? '#000000' : '#FFFFFF'
  const logoColor = isMagenta ? '#000000' : '#F0E040'
  const borderColor = '#000000'
  const { totalItems, toggleCart } = useCart()

  return (
    <header style={{ backgroundColor: bgColor, borderBottom: `2px solid ${borderColor}` }}>
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between" style={{ height: '120px', padding: '0 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
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
        </Link>
        <nav className="flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="font-display text-xs transition-opacity hover:opacity-60" style={{ color: textColor }}>
              {label}
            </Link>
          ))}
          <button onClick={toggleCart} className="flex items-center gap-2 font-display text-xs transition-opacity hover:opacity-60" style={{ color: textColor }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            CARRITO ({totalItems})
          </button>
          <Link href="/cuenta" className="font-display text-xs transition-opacity hover:opacity-60" style={{ color: textColor }}>
            CUENTA
          </Link>
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
          <button onClick={toggleCart} className="font-display text-xs" style={{ color: textColor }}>CARRITO ({totalItems})</button>
        </div>
        <nav className="flex items-center justify-center gap-6 border-t border-gray-800" style={{ padding: '10px 16px' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="font-display text-xs" style={{ color: textColor }}>{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
