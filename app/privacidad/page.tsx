import Navigation from '@/components/layout/Navigation'
import Footer     from '@/components/layout/Footer'
import Link       from 'next/link'

export default function PrivacidadPage() {
  return (
    <>
      <Navigation />
      <main style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>

          <Link href="/contacto" className="font-mono text-xs hover:underline" style={{ color: '#999' }}>← VOLVER</Link>

          <h1 className="font-display mt-6 mb-10" style={{ color: '#F0E040', fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: '1' }}>POLÍTICA DE PRIVACIDAD</h1>

          <Section title="1. RESPONSABLE DEL TRATAMIENTO">
            <p>En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD):</p>
            <ul>
              <li><strong>Responsable:</strong> RHYTHM CONTROL BARCELONA</li>
              <li><strong>Dirección:</strong> Rda. de Sant Pau, 19-21, Local 28, Eixample, 08015 Barcelona, España</li>
              <li><strong>Email:</strong> <a href="mailto:rhythmcontrolshop@gmail.com" className="underline">rhythmcontrolshop@gmail.com</a></li>
            </ul>
          </Section>

          <Section title="2. DATOS QUE RECOGEMOS">
            <ul>
              <li><strong>Cuenta de usuario:</strong> nombre, apellidos, email, contraseña (cifrada), dirección de envío.</li>
              <li><strong>Pedidos:</strong> datos de facturación, dirección de entrega, historial de compras.</li>
              <li><strong>Pago:</strong> gestionado íntegramente por Stripe. No almacenamos datos de tarjeta.</li>
              <li><strong>Formulario de contacto:</strong> nombre, email y mensaje.</li>
              <li><strong>Navegación:</strong> cookies técnicas y analíticas (ver Política de Cookies).</li>
            </ul>
          </Section>

          <Section title="3. FINALIDADES Y BASE JURÍDICA">
            <ul>
              <li><strong>Gestión del contrato de compraventa</strong> — ejecución del contrato (art. 6.1.b RGPD).</li>
              <li><strong>Atención al cliente</strong> — interés legítimo / consentimiento.</li>
              <li><strong>Envío de newsletter</strong> — consentimiento expreso (art. 6.1.a RGPD). Puedes darte de baja en cualquier momento.</li>
              <li><strong>Cumplimiento de obligaciones legales</strong> — obligación legal (art. 6.1.c RGPD).</li>
            </ul>
          </Section>

          <Section title="4. CONSERVACIÓN DE DATOS">
            <p>Los datos se conservan durante el tiempo necesario para cada finalidad:</p>
            <ul>
              <li>Datos de cuenta: mientras la cuenta esté activa y 3 años posteriores al cierre.</li>
              <li>Datos de facturación: 5 años (obligación fiscal).</li>
              <li>Newsletter: hasta la retirada del consentimiento.</li>
            </ul>
          </Section>

          <Section title="5. DESTINATARIOS">
            <p>No cedemos datos a terceros salvo obligación legal o prestadores de servicio necesarios para la actividad:</p>
            <ul>
              <li><strong>Stripe, Inc.</strong> — procesador de pagos (EE.UU., cláusulas contractuales tipo).</li>
              <li><strong>Supabase, Inc.</strong> — base de datos y autenticación (EE.UU., cláusulas contractuales tipo).</li>
              <li><strong>Vercel, Inc.</strong> — alojamiento web (EE.UU., cláusulas contractuales tipo).</li>
              <li><strong>MRW / GLS</strong> — agencias de transporte para la entrega de pedidos.</li>
            </ul>
          </Section>

          <Section title="6. TRANSFERENCIAS INTERNACIONALES">
            <p>Los proveedores citados en la sección anterior están ubicados o pueden tratar datos fuera del Espacio Económico Europeo. Las transferencias se amparan en cláusulas contractuales tipo aprobadas por la Comisión Europea.</p>
          </Section>

          <Section title="7. DERECHOS DE LOS INTERESADOS">
            <p>Puedes ejercer los siguientes derechos escribiendo a <a href="mailto:rhythmcontrolshop@gmail.com" className="underline">rhythmcontrolshop@gmail.com</a>:</p>
            <ul>
              <li><strong>Acceso</strong> — conocer qué datos tratamos sobre ti.</li>
              <li><strong>Rectificación</strong> — corregir datos inexactos.</li>
              <li><strong>Supresión</strong> — solicitar el borrado cuando ya no sean necesarios.</li>
              <li><strong>Oposición</strong> — oponerte al tratamiento basado en interés legítimo.</li>
              <li><strong>Limitación</strong> — solicitar la suspensión del tratamiento en ciertos casos.</li>
              <li><strong>Portabilidad</strong> — recibir tus datos en formato estructurado.</li>
            </ul>
            <p>Tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).</p>
          </Section>

          <Section title="8. SEGURIDAD">
            <p>Aplicamos medidas técnicas y organizativas adecuadas para proteger los datos personales frente a acceso no autorizado, pérdida o destrucción, incluyendo cifrado en tránsito (HTTPS) y en reposo.</p>
          </Section>

          <Section title="9. MODIFICACIONES">
            <p>Podemos actualizar esta política para adaptarla a cambios normativos o funcionales. La versión vigente estará siempre disponible en esta página.</p>
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
