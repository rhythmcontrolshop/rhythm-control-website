'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import LanguageSwitcher from './LanguageSwitcher'
import RhythmControlLogo from '@/components/ui/RhythmControlLogo'

export default function Navigation({ variant = 'default' }: { variant?: 'default' | 'magenta' | 'red' | 'green' | 'stock' }) {
  const isMagenta  = variant === 'magenta'
  const isRed      = variant === 'red'
  const isGreen    = variant === 'green'
  const isStock    = variant === 'stock'
  const isColored  = isMagenta || isRed || isGreen

  const bgColor    = isMagenta ? '#FF00FF' : isRed ? '#F03E3E' : isGreen ? '#77DD77' : '#000000'
  const cellText   = isColored ? '#000000' : '#FFFFFF'
  const logoColor  = isColored ? '#000000' : isStock ? '#9E9893' : '#F0E040'
  const borderCol  = isColored ? '#000000' : '#FFFFFF'

  const { totalItems, toggleCart } = useCart()
  const { t } = useLocale()

  // Tab height matching hero tabs
  const TAB_HEIGHT = '48px'

  const NAV_ITEMS = [
    { type: 'link' as const, href: '/novedades', label: t('nav.novedades'), key: 'novedades' },
    { type: 'link' as const, href: '/stock',     label: t('nav.stock'),      key: 'stock' },
    { type: 'link' as const, href: '/contacto',  label: t('nav.contact'),    key: 'contacto' },
    { type: 'cart' as const, href: '',           label: `${t('nav.cart')} (${totalItems})`, key: 'carrito' },
    { type: 'link' as const, href: '/cuenta',    label: t('nav.account'),   key: 'cuenta' },
    { type: 'lang' as const, href: '',           label: '',                 key: 'lang' },
  ]

  return (
    <header style={{ backgroundColor: bgColor }}>

      {/* ── Logo row — responsive padding ── */}
      <div className="px-4 py-3 md:px-6 md:py-4" style={{ borderBottom: `2px solid ${borderCol}` }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', maxWidth: '100%', height: '48px', overflow: 'hidden' }} className="group">
          {/* Logo — fades out on hover (desktop) */}
          <div className="transition-opacity duration-200 md:group-hover:opacity-0 flex items-center" style={{ height: '48px', lineHeight: 0 }}>
            <RhythmControlLogo height="48px" fill={logoColor} />
          </div>
          {/* BARCELONA — only visible on desktop hover, hidden on mobile */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none overflow-hidden">
            <span style={{ color: logoColor, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1', whiteSpace: 'nowrap' }}>
              BARCELONA
            </span>
          </div>
        </Link>
      </div>

      {/* ── Desktop nav: 6 columns with per-tab hover colors ── */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: `2px solid ${borderCol}` }}>
        {NAV_ITEMS.map((item, i) => {
          const isLast = i === NAV_ITEMS.length - 1

          const cellStyle: React.CSSProperties = {
            backgroundColor: bgColor,
            color: cellText,
            height: TAB_HEIGHT,
            textAlign: 'center',
            textDecoration: 'none',
            borderRight: isLast ? 'none' : `2px solid ${borderCol}`,
          }

          const cellClasses = `font-display text-xs flex items-center justify-center w-full cursor-pointer transition-colors duration-150 nav-tab-${item.key}`

          if (item.type === 'lang') return (
            <div key="lang" className={cellClasses} style={cellStyle}><LanguageSwitcher /></div>
          )
          if (item.type === 'cart') return (
            <button key="cart" onClick={toggleCart}
              className={cellClasses} style={cellStyle}>
              {item.label}
            </button>
          )
          return (
            <Link key={item.href} href={item.href}
              className={cellClasses} style={cellStyle}>
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* ── Mobile nav: 3x2 grid — compact on small screens ── */}
      <div className="grid md:hidden" style={{ gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `2px solid ${borderCol}` }}>
        {NAV_ITEMS.map((item, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const isLastCol  = col === 2
          const isFirstRow = row === 0

          const cellStyle: React.CSSProperties = {
            backgroundColor: bgColor,
            color: cellText,
            padding: '10px 4px',
            fontSize: '0.65rem',
            lineHeight: '1.2',
            wordBreak: 'break-word',
            minHeight: '44px',
            textAlign: 'center',
            textDecoration: 'none',
            borderRight:  isLastCol  ? 'none' : `2px solid ${borderCol}`,
            borderBottom: isFirstRow ? `2px solid ${borderCol}` : 'none',
          }

          const cellClasses = `font-display flex items-center justify-center w-full cursor-pointer transition-colors duration-150 nav-tab-${item.key}`

          if (item.type === 'lang') return (
            <div key="lang-m" className={cellClasses} style={cellStyle}><LanguageSwitcher /></div>
          )
          if (item.type === 'cart') return (
            <button key="cart-m" onClick={toggleCart}
              className={cellClasses} style={cellStyle}>
              {item.label}
            </button>
          )
          return (
            <Link key={item.href + '-m'} href={item.href}
              className={cellClasses} style={cellStyle}>
              {item.label}
            </Link>
          )
        })}
      </div>

    </header>
  )
}
