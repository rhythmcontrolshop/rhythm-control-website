'use client'
// Footer — Identidad única RC: amarillo #F0E040 fondo, texto negro

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from '@/context/LocaleContext'

export default function Footer() {
  const bgColor    = '#F0E040'
  const borderColor = '#000000'
  const textColor   = '#000000'

  const { t } = useLocale()

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

  const LEGAL_LINKS = [
    { href: '/aviso-legal',  label: t('footer.legalNotice') },
    { href: '/privacidad',   label: t('footer.privacy')     },
    { href: '/cookies',      label: t('footer.cookies')     },
    { href: '/terminos',     label: t('footer.terms')       },
  ]

  return (
    <footer style={{ backgroundColor: bgColor, borderTop: `2px solid ${borderColor}` }}>
      <div className="grid grid-cols-1 md:grid-cols-6" style={{ minHeight: '120px' }}>

        <div className="p-6 md:col-span-2 md:border-r-2" style={{ borderColor }}>
          <h3 className="font-display text-2xl" style={{ color: textColor }}>{t('footer.storeName')}</h3>
          <p className="font-mono text-xs mt-2" style={{ color: textColor }}>
            {t('footer.address')}<br />
            {t('footer.district')}<br />
            {t('footer.phone')}
          </p>
          <p className="font-mono text-xs mt-2" style={{ color: textColor }}>
            {t('footer.scheduleWeekday')}<br />
            {t('footer.scheduleSaturday')}
          </p>
        </div>

        <div className="p-6 md:col-span-1 border-t-2 md:border-t-0 md:border-r-2" style={{ borderColor }}>
          <nav className="flex flex-col gap-2">
            <Link href="/stock"     className="font-display text-xs hover:underline" style={{ color: textColor }}>{t('footer.stock')}</Link>
            <Link href="/novedades" className="font-display text-xs hover:underline" style={{ color: textColor }}>{t('footer.novedades')}</Link>
            <Link href="/contacto"  className="font-display text-xs hover:underline" style={{ color: textColor }}>{t('footer.contact')}</Link>
          </nav>
        </div>

        <div className="p-6 md:col-span-1 border-t-2 md:border-t-0 md:border-r-2" style={{ borderColor }}>
          <nav className="flex flex-col gap-2">
            <a href="https://instagram.com/rhythmcontrol.bcn" target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline" style={{ color: textColor }}>{t('footer.instagram')}</a>
            <a href="https://mixcloud.com/rhythmcontrolshop"  target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline" style={{ color: textColor }}>{t('footer.mixcloud')}</a>
          </nav>
        </div>

        <div className="p-6 md:col-span-2 border-t-2 md:border-t-0 flex flex-col justify-between">
          <div>
            <p className="font-display text-xs" style={{ color: textColor }}>{t('footer.newsletter')}</p>
            <form onSubmit={handleNewsletterSubmit} className="flex mt-2">
              <input
                type="email"
                name="newsletter_email"
                placeholder={t('footer.emailPlaceholder')}
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
                className="px-3 font-display text-xs shrink-0 min-h-[44px] hover:bg-[#22C55E] hover:text-black transition-colors"
                style={{ backgroundColor: '#000000', color: '#22C55E', border: '2px solid #000000', cursor: 'pointer' }}>
                →
              </button>
            </form>
            {newsletterStatus === 'ok' && (
              <p className="font-mono text-[10px] mt-1" style={{ color: textColor }}>{t('footer.subscribed')}</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="font-mono text-[10px] mt-1" style={{ color: textColor }}>{t('footer.subscribeError')}</p>
            )}
          </div>
          <p className="font-mono text-[10px] mt-4" style={{ color: textColor }}>
            {t('footer.rights')}
          </p>
        </div>

      </div>

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
