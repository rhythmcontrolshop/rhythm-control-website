'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import LanguageSwitcher from './LanguageSwitcher'
import RhythmControlLogo from '@/components/ui/RhythmControlLogo'

export default function Navigation() {
  const { totalItems, toggleCart } = useCart()
  const { t } = useLocale()

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
    <header style={{ backgroundColor: '#000000' }}>

      {/* ── Logo row ── */}
      <div className="px-4 py-3 md:px-6 md:py-4" style={{ borderBottom: '2px solid #FFFFFF' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', maxWidth: '100%', height: '48px', overflow: 'hidden' }} className="group">
          <div className="transition-opacity duration-200 md:group-hover:opacity-0 flex items-center" style={{ height: '48px', lineHeight: 0 }}>
            <RhythmControlLogo height="48px" fill="#F0E040" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none overflow-hidden">
            <span style={{ color: '#F0E040', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1', whiteSpace: 'nowrap' }}>
              BARCELONA
            </span>
          </div>
        </Link>
      </div>

      {/* ── Desktop nav: 6 columns ── */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '2px solid #FFFFFF' }}>
        {NAV_ITEMS.map((item, i) => {
          const isLast = i === NAV_ITEMS.length - 1

          const cellStyle: React.CSSProperties = {
            backgroundColor: '#000000',
            color: '#FFFFFF',
            height: TAB_HEIGHT,
            textAlign: 'center',
            textDecoration: 'none',
            borderRight: isLast ? 'none' : '2px solid #FFFFFF',
          }

          const cellClasses = 'font-display text-xs flex items-center justify-center w-full cursor-pointer transition-colors duration-150 nav-tab-default'

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

      {/* ── Mobile nav: 3x2 grid ── */}
      <div className="grid md:hidden" style={{ gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '2px solid #FFFFFF' }}>
        {NAV_ITEMS.map((item, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const isLastCol  = col === 2
          const isFirstRow = row === 0

          const cellStyle: React.CSSProperties = {
            backgroundColor: '#000000',
            color: '#FFFFFF',
            padding: '10px 4px',
            fontSize: '0.65rem',
            lineHeight: '1.2',
            wordBreak: 'break-word',
            minHeight: '44px',
            textAlign: 'center',
            textDecoration: 'none',
            borderRight:  isLastCol  ? 'none' : '2px solid #FFFFFF',
            borderBottom: isFirstRow ? '2px solid #FFFFFF' : 'none',
          }

          const cellClasses = 'font-display flex items-center justify-center w-full cursor-pointer transition-colors duration-150 nav-tab-default'

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
