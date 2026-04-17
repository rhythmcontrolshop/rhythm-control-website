import Navigation    from '@/components/layout/Navigation'
import Footer        from '@/components/layout/Footer'
import ContactForm   from '@/components/contact/ContactForm'
import Image         from 'next/image'
import Link          from 'next/link'

const SCHEDULE = [
  { day: 'LUNES',     hours: '15:00–19:45' },
  { day: 'MARTES',    hours: '15:00–19:45' },
  { day: 'MIÉRCOLES', hours: '15:00–20:00' },
  { day: 'JUEVES',    hours: '15:00–19:45' },
  { day: 'VIERNES',   hours: '15:00–19:45' },
  { day: 'SÁBADO',    hours: '12:00–19:45' },
  { day: 'DOMINGO',   hours: 'CERRADO'     },
]

const LEGAL_LINKS = [
  { href: '/aviso-legal', label: 'AVISO LEGAL'  },
  { href: '/privacidad',  label: 'PRIVACIDAD'   },
  { href: '/cookies',     label: 'COOKIES'      },
  { href: '/terminos',    label: 'TÉRMINOS'     },
]

export default function ContactoPage() {
  return (
    <>
      <Navigation variant="green" />
      <main className="relative" style={{ backgroundColor: '#77DD77' }}>

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

          {/* Título */}
          <div className="p-6 border-b-2 border-black">
            <h1 className="font-display text-4xl md:text-5xl uppercase" style={{ letterSpacing: '-0.05em', color: '#000000' }}>
              CONTACTO
            </h1>
            <p className="font-display text-xs mt-2" style={{ color: '#000000' }}>RHYTHM CONTROL BARCELONA · TIENDA DE VINILOS</p>
          </div>

          {/* Dirección + Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-black">

            <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black">
              <h2 className="font-display text-xs mb-4" style={{ color: '#000000' }}>DIRECCIÓN</h2>
              <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: '#000000' }}>
                Rda. de Sant Pau, 19-21, Local 28<br />
                Eixample, 08015 Barcelona
              </p>
              <p className="font-display text-sm mb-4" style={{ color: '#000000' }}>
                <a href="tel:+34696592106" className="hover:underline transition-colors">696 59 21 06</a>
              </p>
              <a
                href="https://maps.google.com/?q=Ronda+de+Sant+Pau+19+Barcelona"
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xs px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors inline-block"
                style={{ color: '#000000' }}>
                VER EN MAPA →
              </a>
            </div>

            <div className="p-6">
              <h2 className="font-display text-xs mb-4" style={{ color: '#000000' }}>HORARIO</h2>
              <div className="space-y-1">
                {SCHEDULE.map(({ day, hours }) => (
                  <div key={day} className="flex justify-between font-mono text-xs" style={{ color: '#000000' }}>
                    <span>{day}</span>
                    <span style={{ fontWeight: hours === 'CERRADO' ? 700 : 400 }}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-6 border-b-2 border-black">
            <h2 className="font-display text-xs mb-4" style={{ color: '#000000' }}>ESCRÍBENOS</h2>
            <ContactForm />
          </div>

          {/* Info venta online + Legal */}
          <div className="p-6 border-b-2 border-black">
            <h2 className="font-display text-xs mb-2" style={{ color: '#000000' }}>INFO VENTA ONLINE</h2>
            <ul className="font-mono text-[10px] space-y-1 list-disc pl-4 mb-4" style={{ color: '#000000' }}>
              <li>Envíos a toda España y Europa a través de agencia (MRW/GLS).</li>
              <li>Plazo de preparación: 24-48h laborables tras confirmación de pago.</li>
              <li>Devoluciones aceptadas en un plazo de 14 días naturales.</li>
              <li>Los discos de segunda mano se revisan antes del envío.</li>
              <li>Pago seguro mediante tarjeta (Stripe).</li>
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
            <a href="https://instagram.com/rhythmcontrol.bcn" target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline transition-colors" style={{ color: '#000000' }}>INSTAGRAM →</a>
            <a href="https://mixcloud.com/rhythmcontrolshop"  target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline transition-colors" style={{ color: '#000000' }}>MIXCLOUD →</a>
          </div>

        </div>
      </main>

      <Footer variant="green" />
    </>
  )
}
