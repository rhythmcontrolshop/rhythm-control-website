import Navigation from '@/components/layout/Navigation'
import Footer     from '@/components/layout/Footer'
import Link       from 'next/link'

export default function TerminosPage() {
  return (
    <>
      <Navigation />
      <main style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>

          <Link href="/contacto" className="font-mono text-xs hover:underline" style={{ color: '#999' }}>← VOLVER</Link>

          <h1 className="font-display mt-6 mb-10" style={{ color: '#F0E040', fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: '1' }}>TÉRMINOS Y CONDICIONES</h1>

          <Section title="1. OBJETO">
            <p>Las presentes condiciones regulan la contratación de productos a través de la tienda online de RHYTHM CONTROL BARCELONA (en adelante, "la tienda"), con domicilio en Rda. de Sant Pau, 19-21, Local 28, Eixample, 08015 Barcelona.</p>
          </Section>

          <Section title="2. PROCESO DE COMPRA">
            <p>Para realizar un pedido debes:</p>
            <ol>
              <li>Crear una cuenta o iniciar sesión.</li>
              <li>Añadir productos al carrito y proceder al pago.</li>
              <li>Introducir los datos de envío y seleccionar el método de pago.</li>
              <li>Confirmar el pedido. Recibirás un email de confirmación.</li>
            </ol>
            <p>El contrato se perfecciona en el momento en que recibes la confirmación del pedido por email.</p>
          </Section>

          <Section title="3. PRECIOS E IVA">
            <p>Los precios mostrados incluyen el IVA aplicable. Nos reservamos el derecho a modificar precios sin previo aviso, si bien el precio que se aplica es el vigente en el momento de confirmar el pedido.</p>
          </Section>

          <Section title="4. DISPONIBILIDAD DE STOCK">
            <p>Todos los artículos están sujetos a disponibilidad de stock. En el caso excepcional de que un artículo no esté disponible tras confirmar el pedido, te contactaremos para ofrecerte una alternativa o proceder al reembolso íntegro.</p>
          </Section>

          <Section title="5. MÉTODOS DE PAGO">
            <p>Aceptamos pago mediante tarjeta de crédito/débito a través de Stripe. La transacción se procesa de forma segura y cifrada. No almacenamos datos de pago en nuestros servidores.</p>
          </Section>

          <Section title="6. ENVÍOS">
            <ul>
              <li><strong>Ámbito:</strong> España peninsular, Baleares y países de la UE.</li>
              <li><strong>Transportistas:</strong> MRW / GLS.</li>
              <li><strong>Plazo de preparación:</strong> 24–48 horas laborables tras la confirmación del pago.</li>
              <li><strong>Plazo de entrega estimado:</strong> 2–5 días laborables (España); 5–10 días (UE).</li>
              <li><strong>Costes:</strong> los gastos de envío se muestran durante el proceso de compra antes de confirmar el pedido.</li>
            </ul>
          </Section>

          <Section title="7. RECOGIDA EN TIENDA">
            <p>Puedes optar por recoger tu pedido en nuestra tienda física sin coste adicional. Te notificaremos cuando esté listo. El pedido se reserva durante 7 días naturales; transcurrido ese plazo sin recogida, procederemos al reembolso.</p>
          </Section>

          <Section title="8. DERECHO DE DESISTIMIENTO">
            <p>De conformidad con el Real Decreto Legislativo 1/2007, tienes derecho a desistir del contrato en un plazo de 14 días naturales desde la recepción del producto, sin necesidad de justificación.</p>
            <p>Para ejercer este derecho, contacta con nosotros en <a href="mailto:rhythmcontrolshop@gmail.com" className="underline">rhythmcontrolshop@gmail.com</a> antes de que expire el plazo. El producto debe devolverse en su estado original y embalaje. Los gastos de devolución corren a cargo del comprador salvo que el artículo sea defectuoso.</p>
          </Section>

          <Section title="9. DISCOS DE SEGUNDA MANO">
            <p>Los artículos de segunda mano se describen según la escala de gradación estándar (Discogs / Goldmine). Todos los discos se revisan antes del envío. Dada la naturaleza del producto, el estado puede variar ligeramente respecto a la descripción; si el artículo no corresponde a lo descrito, procederemos a su sustitución o reembolso completo.</p>
          </Section>

          <Section title="10. GARANTÍAS Y PRODUCTOS DEFECTUOSOS">
            <p>Los artículos nuevos gozan de la garantía legal de 3 años establecida en el TRLGDCU. En caso de producto defectuoso, contáctanos en los 30 días siguientes a la recepción para gestionar la devolución o sustitución sin coste alguno.</p>
          </Section>

          <Section title="11. RESPONSABILIDAD">
            <p>La tienda no será responsable de retrasos en la entrega causados por el transportista, fuerza mayor, o datos de envío incorrectos facilitados por el cliente. Las imágenes de los productos son orientativas; el aspecto real puede variar ligeramente.</p>
          </Section>

          <Section title="12. PROTECCIÓN DE DATOS">
            <p>El tratamiento de tus datos personales se rige por nuestra <Link href="/privacidad" className="underline">Política de Privacidad</Link>.</p>
          </Section>

          <Section title="13. LEGISLACIÓN APLICABLE Y JURISDICCIÓN">
            <p>Las presentes condiciones se rigen por la legislación española. Para la resolución de litigios, las partes se someten a los juzgados del domicilio del consumidor, sin perjuicio del derecho a acudir a la plataforma de resolución de litigios en línea de la UE (<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="underline">ec.europa.eu/consumers/odr</a>).</p>
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
