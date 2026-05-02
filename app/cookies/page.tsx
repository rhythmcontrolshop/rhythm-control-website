import Navigation from '@/components/layout/Navigation'
import Footer     from '@/components/layout/Footer'
import Link       from 'next/link'

export default function CookiesPage() {
  return (
    <>
      <Navigation />
      <main style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>

          <Link href="/contacto" className="font-mono text-xs hover:underline" style={{ color: '#999' }}>← VOLVER</Link>

          <h1 className="font-display mt-6 mb-10" style={{ color: '#F0E040', fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: '1' }}>POLÍTICA DE COOKIES</h1>

          <Section title="1. ¿QUÉ SON LAS COOKIES?">
            <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten recordar tus preferencias y mejorar tu experiencia de navegación.</p>
          </Section>

          <Section title="2. COOKIES QUE UTILIZAMOS">
            <p><strong>Cookies estrictamente necesarias</strong></p>
            <ul>
              <li><strong>Sesión de usuario</strong> — mantienen la sesión activa tras el inicio de sesión. Sin estas cookies el sitio no funciona correctamente.</li>
              <li><strong>Carrito de compra</strong> — conservan los artículos añadidos al carrito durante la navegación.</li>
            </ul>
            <p><strong>Cookies funcionales</strong></p>
            <ul>
              <li><strong>Preferencia de idioma</strong> — recuerdan el idioma seleccionado (ES / EN).</li>
            </ul>
            <p><strong>Cookies analíticas</strong></p>
            <ul>
              <li><strong>Análisis de uso</strong> — datos agregados y anónimos sobre cómo se usa el sitio (páginas visitadas, tiempo de sesión). No se vinculan a datos personales identificables.</li>
            </ul>
            <p>No utilizamos cookies de publicidad ni de seguimiento de terceros.</p>
          </Section>

          <Section title="3. DURACIÓN">
            <ul>
              <li><strong>Cookies de sesión:</strong> se eliminan al cerrar el navegador.</li>
              <li><strong>Cookies persistentes:</strong> se conservan hasta 12 meses o hasta que las elimines manualmente.</li>
            </ul>
          </Section>

          <Section title="4. TERCEROS">
            <p>Algunos servicios integrados pueden instalar sus propias cookies:</p>
            <ul>
              <li><strong>Stripe</strong> — para el proceso de pago seguro.</li>
              <li><strong>Supabase</strong> — para la gestión de autenticación.</li>
            </ul>
            <p>Consulta las políticas de privacidad de estos proveedores para más información.</p>
          </Section>

          <Section title="5. CÓMO GESTIONAR LAS COOKIES">
            <p>Puedes configurar o desactivar las cookies desde la configuración de tu navegador:</p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="underline">Microsoft Edge</a></li>
            </ul>
            <p>Ten en cuenta que desactivar ciertas cookies puede afectar al funcionamiento del sitio.</p>
          </Section>

          <Section title="6. BASE JURÍDICA">
            <p>Las cookies estrictamente necesarias se instalan sin necesidad de consentimiento (art. 22.2 LSSI-CE). Para las demás categorías solicitamos tu consentimiento previo, que puedes retirar en cualquier momento.</p>
          </Section>

          <Section title="7. ACTUALIZACIONES">
            <p>Podemos actualizar esta política cuando sea necesario. La fecha de última actualización aparecerá al pie de esta página. Te recomendamos revisarla periódicamente.</p>
          </Section>

        </div>
      </main>
      <Footer />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 pb-8" style={{ borderBottom: '1px solid #1C1C1C' }}>
      <h2 className="font-display text-sm mb-4" style={{ color: '#F0E040' }}>{title}</h2>
      <div className="font-mono text-xs leading-relaxed space-y-3" style={{ color: '#CCCCCC' }}>
        {children}
      </div>
    </section>
  )
}
