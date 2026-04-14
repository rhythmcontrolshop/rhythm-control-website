import Navigation    from '@/components/layout/Navigation'
import Footer        from '@/components/layout/Footer'
import ContactForm   from '@/components/contact/ContactForm'
import Image         from 'next/image'

const SCHEDULE = [
  { day: 'LUNES', hours: '15:00–19:45' },
  { day: 'MARTES', hours: '15:00–19:45' },
  { day: 'MIÉRCOLES', hours: '15:00–20:00' },
  { day: 'JUEVES', hours: '15:00–19:45' },
  { day: 'VIERNES', hours: '15:00–19:45' },
  { day: 'SÁBADO', hours: '12:00–19:45' },
  { day: 'DOMINGO', hours: 'CERRADO' },
]

export default function ContactoPage() {
  return (
    <>
      <Navigation />
      <main className="relative" style={{ backgroundColor: '#FFFFFF' }}>
        
        {/* IMAGEN COMPLETA ARRIBA */}
        <div className="relative w-full border-b-2 border-black">
          <Image 
            src="/contact.jpg"
            alt="Rhythm Control Store"
            width={1620}
            height={857}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* CONTENIDO DEBAJO */}
        <div className="max-w-7xl mx-auto">
          
          {/* Título */}
          <div className="p-6 border-b-2 border-black">
            <h1 className="font-display text-4xl md:text-5xl uppercase" style={{ letterSpacing: '-0.05em', color: '#000000' }}>
              CONTACTO
            </h1>
            <p className="font-display text-xs mt-2" style={{ color: '#000000' }}>TIENDA DE VINILOS · BARCELONA</p>
          </div>

          {/* Grid: Datos + Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-black">
            
            {/* Dirección y Teléfono */}
            <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black">
              <h2 className="font-display text-xs mb-4" style={{ color: '#000000' }}>DIRECCIÓN</h2>
              <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: '#000000' }}>
                Rda. de Sant Pau, 19-21<br />
                Local 28, Eixample<br />
                08015 Barcelona
              </p>
              <p className="font-display text-sm mb-4" style={{ color: '#000000' }}>
                <a href="tel:+34696592106" className="hover:text-[#F0E040] transition-colors">696 59 21 06</a>
              </p>
              <a 
                href="https://maps.google.com/?q=Rda.+de+Sant+Pau+19+21+Barcelona" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-display text-xs px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                style={{ color: '#000000' }}
              >
                VER EN MAPA →
              </a>
            </div>

            {/* Horarios */}
            <div className="p-6">
              <h2 className="font-display text-xs mb-4" style={{ color: '#000000' }}>HORARIO</h2>
              <div className="space-y-1">
                {SCHEDULE.map(({ day, hours }) => (
                  <div key={day} className="flex justify-between font-mono text-xs" style={{ color: '#000000' }}>
                    <span>{day}</span>
                    <span className={hours === 'CERRADO' ? 'text-red-600' : ''}>{hours}</span>
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

          {/* Disclaimers */}
          <div className="p-6 border-b-2 border-black">
            <h2 className="font-display text-xs mb-2" style={{ color: '#000000' }}>INFO VENTA ONLINE</h2>
            <ul className="font-mono text-[10px] space-y-1 list-disc pl-4" style={{ color: '#000000' }}>
              <li>Envíos a toda España y Europa a través de agencia (MRW/GLS).</li>
              <li>Plazo de preparación: 24-48h laborables tras confirmación de pago.</li>
              <li>Devoluciones aceptadas en un plazo de 14 días naturales.</li>
              <li>Los discos de segunda mano se revisan antes del envío.</li>
              <li>Pago seguro mediante tarjeta, PayPal o transferencia.</li>
            </ul>
          </div>

          {/* Redes Sociales */}
          <div className="p-6 flex gap-4">
            <a href="https://instagram.com/rhythmcontrol" target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:text-[#F0E040] transition-colors" style={{ color: '#000000' }}>INSTAGRAM →</a>
            <a href="https://mixcloud.com/rhythmcontrolshop" target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:text-[#F0E040] transition-colors" style={{ color: '#000000' }}>MIXCLOUD →</a>
          </div>

        </div>
      </main>
      
      <Footer />
    </>
  )
}
