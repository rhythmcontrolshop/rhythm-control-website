'use client'
// E2-2: Conectado al API /api/newsletter (Resend)
// E3-9: Footer grid-cols-1 on mobile (was grid-cols-2 cramped)
// E3-20: Newsletter input with proper attributes

import { useState } from 'react'
import Link from 'next/link'

interface FooterProps {
  variant?: 'yellow' | 'magenta' | 'green'
}

const LEGAL_LINKS = [
  { href: '/aviso-legal',  label: 'AVISO LEGAL'  },
  { href: '/privacidad',   label: 'PRIVACIDAD'   },
  { href: '/cookies',      label: 'COOKIES'      },
  { href: '/terminos',     label: 'TÉRMINOS'     },
]

export default function Footer({ variant = 'yellow' }: FooterProps) {
  const bgColor    = variant === 'magenta' ? '#FF00FF' : variant === 'green' ? '#77DD77' : '#F0E040'
  const borderColor = '#000000'
  const textColor   = '#000000'

  const [email, setEmail]           = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setNewsletterStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setNewsletterStatus('ok')
        setEmail('')
      } else {
        setNewsletterStatus('error')
      }
    } catch {
      setNewsletterStatus('error')
    }
  }

  return (
    <footer style={{ backgroundColor: bgColor, borderTop: `2px solid ${borderColor}` }}>
      {/* E3-9: grid-cols-1 on mobile, grid-cols-6 on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-6" style={{ minHeight: '120px' }}>

        <div className="p-6 md:col-span-2 md:border-r-2" style={{ borderColor }}>
          <h3 className="font-display text-2xl" style={{ color: textColor }}>RHYTHM CONTROL BARCELONA</h3>
          <p className="font-mono text-xs mt-2" style={{ color: textColor }}>
            Rda. de Sant Pau, 19-21, Local 28<br />
            Eixample, 08015 Barcelona<br />
            696 59 21 06
          </p>
          <p className="font-mono text-xs mt-2" style={{ color: textColor }}>
            LUN–VIE 15:00–19:45 · MIÉ hasta 20:00<br />
            SÁB 12:00–19:45 · DOM CERRADO
          </p>
        </div>

        <div className="p-6 md:col-span-1 border-t-2 md:border-t-0 md:border-r-2" style={{ borderColor }}>
          <nav className="flex flex-col gap-2">
            <Link href="/stock"     className="font-display text-xs hover:underline" style={{ color: textColor }}>STOCK</Link>
            <Link href="/novedades" className="font-display text-xs hover:underline" style={{ color: textColor }}>NOVEDADES</Link>
            <Link href="/contacto"  className="font-display text-xs hover:underline" style={{ color: textColor }}>CONTACTO</Link>
          </nav>
        </div>

        <div className="p-6 md:col-span-1 border-t-2 md:border-t-0 md:border-r-2" style={{ borderColor }}>
          <nav className="flex flex-col gap-2">
            <a href="https://instagram.com/rhythmcontrol.bcn" target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline" style={{ color: textColor }}>INSTAGRAM →</a>
            <a href="https://mixcloud.com/rhythmcontrolshop"  target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline" style={{ color: textColor }}>MIXCLOUD →</a>
          </nav>
        </div>

        <div className="p-6 md:col-span-2 border-t-2 md:border-t-0 flex flex-col justify-between">
          <div>
            <p className="font-display text-xs" style={{ color: textColor }}>NEWSLETTER</p>
            {/* E3-20: inputMode="email" for mobile keyboard */}
            <form onSubmit={handleNewsletterSubmit} className="flex mt-2">
              <input
                type="email"
                name="newsletter_email"
                placeholder="EMAIL"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 font-mono text-xs placeholder:text-white"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', border: 'none', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="px-3 font-display text-xs shrink-0 min-h-[44px]"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}>
                →
              </button>
            </form>
            {newsletterStatus === 'ok' && (
              <p className="font-mono text-[10px] mt-1" style={{ color: textColor }}>¡Suscrito!</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="font-mono text-[10px] mt-1" style={{ color: textColor }}>Error. Inténtalo de nuevo.</p>
            )}
          </div>
          <p className="font-mono text-[10px] mt-4" style={{ color: textColor }}>
            © 2026 RHYTHM CONTROL BARCELONA. ALL RIGHTS RESERVED.
          </p>
        </div>

      </div>

      {/* Legal links bar */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-6 py-3" style={{ borderTop: `1px solid ${borderColor}` }}>
        {LEGAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="font-mono text-[10px] hover:underline" style={{ color: textColor }}>
            {label}
          </Link>
        ))}
      </div>
    </footer>
  )
}
