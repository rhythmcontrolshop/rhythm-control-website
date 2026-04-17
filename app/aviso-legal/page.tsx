import Navigation from '@/components/layout/Navigation'
import Footer     from '@/components/layout/Footer'
import Link       from 'next/link'

export default function AvisoLegalPage() {
  return (
    <>
      <Navigation />
      <main style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>

          <Link href="/contacto" className="font-mono text-xs hover:underline" style={{ color: '#999' }}>← VOLVER</Link>

          <h1 className="font-display mt-6 mb-10" style={{ color: '#F0E040', fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: '1' }}>AVISO LEGAL</h1>

          <Section title="1. DATOS IDENTIFICATIVOS">
            <p>En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos:</p>
            <ul>
              <li><strong>Titular:</strong> RHYTHM CONTROL BARCELONA</li>
              <li><strong>Dirección:</strong> Rda. de Sant Pau, 19-21, Local 28, Eixample, 08015 Barcelona, España</li>
              <li><strong>Email:</strong> <a href="mailto:rhythmcontrolshop@gmail.com" className="underline">rhythmcontrolshop@gmail.com</a></li>
              <li><strong>Teléfono:</strong> 696 59 21 06</li>
            </ul>
          </Section>

          <Section title="2. OBJETO Y ÁMBITO">
            <p>El presente sitio web tiene como finalidad la comercialización online de discos de vinilo, música y productos relacionados. El acceso y uso del sitio web atribuye la condición de usuario, implicando la aceptación plena de las presentes condiciones.</p>
          </Section>

          <Section title="3. CONDICIONES DE USO">
            <p>El usuario se compromete a hacer un uso adecuado del sitio web, no realizar actividades ilícitas o contrarias a la buena fe, y no dañar los sistemas físicos o lógicos del titular.</p>
          </Section>

          <Section title="4. PROPIEDAD INTELECTUAL E INDUSTRIAL">
            <p>Todos los contenidos del sitio web (diseño, textos, imágenes, logotipos, código fuente) son titularidad del responsable o dispone de derechos suficientes para su uso. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.</p>
          </Section>

          <Section title="5. EXCLUSIÓN DE RESPONSABILIDAD">
            <p>El titular no se responsabiliza de errores u omisiones en los contenidos, falta de disponibilidad del sitio web, ni de daños derivados de virus o programas maliciosos.</p>
          </Section>

          <Section title="6. ENLACES EXTERNOS">
            <p>El sitio web puede incluir enlaces a páginas de terceros, no asumiendo responsabilidad sobre sus contenidos o políticas.</p>
          </Section>

          <Section title="7. LEGISLACIÓN APLICABLE Y JURISDICCIÓN">
            <p>La relación se regirá por la legislación española. Para la resolución de conflictos, las partes se someterán a los juzgados y tribunales del domicilio del consumidor.</p>
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
