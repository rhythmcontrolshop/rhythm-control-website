'use client'
// E3-2: onMouseEnter/Leave → CSS :hover/:active
// E3-8: Navigation móvil legible (fontSize 0.75rem mínimo)
// E3-15: BARCELONA visible en móvil (no hover-only)

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import LanguageSwitcher from './LanguageSwitcher'
import RhythmControlLogo from '@/components/ui/RhythmControlLogo'

export default function Navigation({ variant = 'default' }: { variant?: 'default' | 'magenta' | 'green' }) {
  const isMagenta  = variant === 'magenta'
  const isGreen    = variant === 'green'
  const isColored  = isMagenta || isGreen

  // E3-3: Use CSS variable references where possible
  const bgColor    = isMagenta ? '#FF00FF' : isGreen ? '#77DD77' : 'var(--rc-color-bg)'
  const cellText   = isColored ? '#000000' : 'var(--rc-color-text)'
  const logoColor  = isColored ? '#000000' : 'var(--rc-color-accent)'
  const borderCol  = isColored ? '#000000' : 'var(--rc-color-text)'
  const hoverBg    = 'var(--rc-color-accent)'  // #F0E040
  const hoverText  = '#000000'

  const { totalItems, toggleCart } = useCart()
  const { t } = useLocale()

  const NAV_ITEMS = [
    { type: 'link' as const, href: '/novedades', label: t('nav.novedades') },
    { type: 'link' as const, href: '/stock',     label: 'STOCK'            },
    { type: 'link' as const, href: '/contacto',  label: t('nav.contact')   },
    { type: 'cart' as const, href: '',           label: `CARRITO (${totalItems})` },
    { type: 'link' as const, href: '/cuenta',    label: t('nav.account')   },
    { type: 'lang' as const, href: '',           label: ''                 },
  ]

  return (
    <header style={{ backgroundColor: bgColor, overflow: 'hidden' }}>

      {/* ── Logo row ── */}
      <div style={{ padding: '16px 24px', borderBottom: `2px solid ${borderCol}` }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', maxWidth: '100%' }} className="group">
          {/* E3-15: Logo always visible; BARCELONA on hover (desktop) or always (mobile) */}
          <div className="transition-opacity duration-200 md:group-hover:opacity-0" style={{ lineHeight: 0 }}>
            <RhythmControlLogo height="48px" fill={logoColor} />
          </div>
          {/* E3-15: BARCELONA visible on hover (desktop) AND always on mobile via md:opacity-0 */}
          <div className="absolute inset-0 flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none overflow-hidden">
            <span style={{ color: logoColor, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: 'clamp(1.5rem, 6vw, 3rem)', fontWeight: '900', letterSpacing: '-0.02em', lineHeight: '1', whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 48px)' }}>
              BARCELONA
            </span>
          </div>
        </Link>
      </div>

      {/* ── Desktop nav: 6 columns — E3-2: CSS hover instead of onMouseEnter/Leave ── */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: `2px solid ${borderCol}` }}>
        {NAV_ITEMS.map((item, i) => {
          const isLast = i === NAV_ITEMS.length - 1

          // E3-2: CSS classes for hover — no JS event handlers
          const cellClasses = 'font-display text-xs flex items-center justify-center w-full cursor-pointer transition-colors duration-150 hover:bg-[var(--rc-color-accent)] hover:text-black'

          const cellStyle: React.CSSProperties = {
            backgroundColor: bgColor,
            color: cellText,
            padding: '14px 0',
            textAlign: 'center',
            textDecoration: 'none',
            borderRight: isLast ? 'none' : `2px solid ${borderCol}`,
          }

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

      {/* ── Mobile nav: 3×2 grid — E3-8: fontSize 0.75rem minimum, better padding ── */}
      <div className="grid md:hidden" style={{ gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `2px solid ${borderCol}` }}>
        {NAV_ITEMS.map((item, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const isLastCol  = col === 2
          const isFirstRow = row === 0

          // E3-2: CSS hover + E3-8: larger font + E3-10: min 44px height
          const cellClasses = 'font-display flex items-center justify-center w-full cursor-pointer transition-colors duration-150 active:bg-[var(--rc-color-accent)] active:text-black'

          const cellStyle: React.CSSProperties = {
            backgroundColor: bgColor,
            color: cellText,
            padding: '12px 6px',
            fontSize: '0.75rem',   // E3-8: 0.75rem minimum (was 0.65rem)
            lineHeight: '1.2',
            wordBreak: 'break-word',
            minHeight: '44px',     // E3-10: touch target minimum
            textAlign: 'center',
            textDecoration: 'none',
            borderRight:  isLastCol  ? 'none' : `2px solid ${borderCol}`,
            borderBottom: isFirstRow ? `2px solid ${borderCol}` : 'none',
          }

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
