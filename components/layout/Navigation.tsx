'use client'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import LanguageSwitcher from './LanguageSwitcher'

const TAB_CELL: CSSProperties = {
  backgroundColor: '#000000',
  color: '#FFFFFF',
  padding: '14px 0',
  cursor: 'pointer',
  transition: 'background-color 0.15s, color 0.15s',
  textAlign: 'center' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRight: '2px solid #FFFFFF',
  textDecoration: 'none',
  width: '100%',
}

function onEnter(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.backgroundColor = '#F0E040'
  e.currentTarget.style.color = '#000000'
}
function onLeave(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.backgroundColor = '#000000'
  e.currentTarget.style.color = '#FFFFFF'
}

const LOGO_PATHS = (
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
)

export default function Navigation({ variant = 'default' }: { variant?: 'default' | 'magenta' | 'green' }) {
  const isMagenta = variant === 'magenta'
  const isGreen   = variant === 'green'
  const bgColor   = isMagenta ? '#FF00FF' : isGreen ? '#77DD77' : '#000000'
  const logoColor = (isMagenta || isGreen) ? '#000000' : '#F0E040'

  const { totalItems, toggleCart } = useCart()
  const { t } = useLocale()

  const NAV_ITEMS = [
    { type: 'link' as const,   href: '/novedades', label: t('nav.novedades') },
    { type: 'link' as const,   href: '/stock',     label: 'STOCK'            },
    { type: 'link' as const,   href: '/contacto',  label: t('nav.contact')   },
    { type: 'cart' as const,   href: '',           label: `CARRITO (${totalItems})` },
    { type: 'link' as const,   href: '/cuenta',    label: t('nav.account')   },
    { type: 'lang' as const,   href: '',           label: ''                 },
  ]

  return (
    <header style={{ backgroundColor: bgColor, overflow: 'hidden' }}>

      {/* ── Logo row ── */}
      <div style={{ padding: '16px 24px', borderBottom: '2px solid #FFFFFF' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', maxWidth: '100%' }} className="group">
          {/* default: RHYTHM CONTROL logo */}
          <div className="transition-opacity duration-200 group-hover:opacity-0" style={{ lineHeight: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 627.27 49.85"
              style={{ height: '48px', width: 'auto', maxWidth: 'min(600px, calc(100vw - 48px))' }}
              fill={logoColor}>
              {LOGO_PATHS}
            </svg>
          </div>
          {/* hover: BARCELONA text */}
          <div className="absolute inset-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span style={{ color: logoColor, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.02em', lineHeight: '1', whiteSpace: 'nowrap' }}>
              BARCELONA
            </span>
          </div>
        </Link>
      </div>

      {/* ── Desktop nav: 6 equal columns ── */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '2px solid #FFFFFF' }}>
        {NAV_ITEMS.map((item, i) => {
          const isLast = i === NAV_ITEMS.length - 1
          const cellStyle: CSSProperties = { ...TAB_CELL, borderRight: isLast ? 'none' : '2px solid #FFFFFF' }

          if (item.type === 'lang') {
            return (
              <div key="lang" style={cellStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <LanguageSwitcher />
              </div>
            )
          }
          if (item.type === 'cart') {
            return (
              <button key="cart" onClick={toggleCart} className="font-display text-xs"
                style={cellStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                {item.label}
              </button>
            )
          }
          return (
            <Link key={item.href} href={item.href} className="font-display text-xs"
              style={cellStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* ── Mobile nav: 3×2 grid ── */}
      <div className="grid md:hidden" style={{ gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '2px solid #FFFFFF' }}>
        {NAV_ITEMS.map((item, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const isLastCol = col === 2
          const isFirstRow = row === 0
          const cellStyle: CSSProperties = {
            ...TAB_CELL,
            borderRight: isLastCol ? 'none' : '2px solid #FFFFFF',
            borderBottom: isFirstRow ? '2px solid #FFFFFF' : 'none',
            padding: '12px 0',
            fontSize: '0.6rem',
          }

          if (item.type === 'lang') {
            return (
              <div key="lang-m" style={cellStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <LanguageSwitcher />
              </div>
            )
          }
          if (item.type === 'cart') {
            return (
              <button key="cart-m" onClick={toggleCart} className="font-display"
                style={cellStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                {item.label}
              </button>
            )
          }
          return (
            <Link key={item.href + '-m'} href={item.href} className="font-display"
              style={cellStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
              {item.label}
            </Link>
          )
        })}
      </div>

    </header>
  )
}
