'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from '@/context/LocaleContext'

export default function LanguageSwitcher() {
  const { locale, setLocale, locales } = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onOutside)
    return () => document.removeEventListener('pointerdown', onOutside)
  }, [])

  const currentLabel = locale.toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="font-display text-xs w-full h-full flex items-center justify-between hover:opacity-80 transition-opacity duration-150"
        style={{ padding: '0 12px', color: '#FFFFFF', minHeight: '44px' }}
      >
        <span>{currentLabel}</span>
        <span style={{ fontSize: '0.55rem', opacity: 0.7, marginLeft: '4px' }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '-2px',
          right: '-2px',
          backgroundColor: '#000000',
          border: '2px solid #FFFFFF',
          borderTop: 'none',
          zIndex: 50,
        }}>
          {locales.map(l => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false) }}
              className="font-display text-xs block w-full text-left hover:bg-[#F0E040] hover:text-black active:bg-[#F0E040] active:text-black transition-colors duration-150"
              style={{
                color: locale === l ? '#F0E040' : '#FFFFFF',
                backgroundColor: locale === l ? 'rgba(240,224,64,0.08)' : '#000000',
                padding: '12px 16px',
                borderBottom: '1px solid #1C1C1C',
                minHeight: '44px',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
