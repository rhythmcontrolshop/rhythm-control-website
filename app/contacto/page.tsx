'use client'

import Navigation    from '@/components/layout/Navigation'
import Footer        from '@/components/layout/Footer'
import ContactForm   from '@/components/contact/ContactForm'
import Image         from 'next/image'
import Link          from 'next/link'
import { useLocale } from '@/context/LocaleContext'

export default function ContactoPage() {
  const { t } = useLocale()

  const SCHEDULE = [
    { day: t('contact.mon'), hours: '15:00–19:45' },
    { day: t('contact.tue'), hours: '15:00–19:45' },
    { day: t('contact.wed'), hours: '15:00–20:00' },
    { day: t('contact.thu'), hours: '15:00–19:45' },
    { day: t('contact.fri'), hours: '15:00–19:45' },
    { day: t('contact.sat'), hours: '12:00–19:45' },
    { day: t('contact.sun'), hours: t('contact.closed') },
  ]

  const LEGAL_LINKS = [
    { href: '/aviso-legal', label: t('footer.legalNotice') },
    { href: '/privacidad',  label: t('footer.privacy')     },
    { href: '/cookies',     label: t('footer.cookies')     },
    { href: '/terminos',    label: t('footer.terms')       },
  ]

  return (
    <>
      <Navigation />
      {/* Trecho diferencial: fondo amarillo, texto negro */}
      <main className="relative" style={{ backgroundColor: '#F0E040' }}>

        {/* Imagen superior */}
        <div className="relative w-full border-b-2 border-black">
          <div className="relative w-full" style={{ mixBlendMode: 'multiply' }}>
            <Image
              src="/contact.jpg"
              alt="Rhythm Control Store"
              width={1620}
              height={857}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto">

          {/* Título: negro sobre amarillo */}
          <div className="p-6 border-b-2 border-black">
            <h1 className="font-display text-4xl md:text-5xl uppercase" style={{ letterSpacing: '-0.05em', color: '#000000' }}>
              {t('contact.title')}
            </h1>
            <p className="font-display text-xs mt-2" style={{ color: '#000000' }}>{t('contact.subtitle')}</p>
          </div>

          {/* Dirección + Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-black">

            <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black">
              <h2 className="font-display text-xs mb-4" style={{ color: '#000000' }}>{t('contact.address').toUpperCase()}</h2>
              <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: '#000000' }}>
                {t('footer.address')}<br />
                {t('footer.district')}
              </p>
              <p className="font-display text-sm mb-4" style={{ color: '#000000' }}>
                <a href="tel:+34696592106" className="hover:underline transition-colors">{t('footer.phone')}</a>
              </p>
              <a
                href="https://maps.google.com/?q=Ronda+de+Sant+Pau+19+Barcelona"
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xs px-4 py-2 border-2 border-black inline-block"
                style={{ color: '#000000', backgroundColor: '#F0E040', transition: 'background-color 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#F0E040' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F0E040'; e.currentTarget.style.color = '#000000' }}
              >
                {t('btn.viewMap')}
              </a>
            </div>

            <div className="p-6">
              <h2 className="font-display text-xs mb-4" style={{ color: '#000000' }}>{t('contact.schedule').toUpperCase()}</h2>
              <div className="space-y-1">
                {SCHEDULE.map(({ day, hours }) => (
                  <div key={day} className="flex justify-between font-mono text-xs" style={{ color: '#000000' }}>
                    <span>{day}</span>
                    <span style={{ fontWeight: hours === t('contact.closed') ? 700 : 400 }}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-6 border-b-2 border-black">
            <h2 className="font-display text-xs mb-4" style={{ color: '#000000' }}>{t('contact.writeUs')}</h2>
            <ContactForm />
          </div>

          {/* Info venta online + Legal */}
          <div className="p-6 border-b-2 border-black">
            <h2 className="font-display text-xs mb-2" style={{ color: '#000000' }}>{t('contact.onlineInfo')}</h2>
            <ul className="font-mono text-[10px] space-y-1 list-disc pl-4 mb-4" style={{ color: '#000000' }}>
              <li>{t('contact.onlineInfo1')}</li>
              <li>{t('contact.onlineInfo2')}</li>
              <li>{t('contact.onlineInfo3')}</li>
              <li>{t('contact.onlineInfo4')}</li>
              <li>{t('contact.onlineInfo5')}</li>
            </ul>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {LEGAL_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className="font-mono text-[10px] underline hover:opacity-70 transition-opacity" style={{ color: '#000000' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Redes */}
          <div className="p-6 flex gap-4">
            <a href="https://instagram.com/rhythmcontrol.bcn" target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline transition-colors" style={{ color: '#000000' }}>{t('footer.instagram')}</a>
            <a href="https://mixcloud.com/rhythmcontrolshop"  target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline transition-colors" style={{ color: '#000000' }}>{t('footer.mixcloud')}</a>
          </div>

        </div>
      </main>

      <Footer />
    </>
  )
}
