// app/admin/facturas/page.tsx
// Admin — Invoice management (list + generate)

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function FacturasPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_type, source_type, customer_name, customer_nif, total, status, issued_at')
    .order('issued_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-xl" style={{ letterSpacing: '0.04em' }}>FACTURAS</h1>
          <p className="font-mono text-xs mt-1" style={{ color: '#6B7280' }}>Gestión de facturación española</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Emitidas', value: invoices?.filter(i => i.status === 'issued').length ?? 0 },
          { label: 'Anuladas', value: invoices?.filter(i => i.status === 'cancelled').length ?? 0 },
          { label: 'Rectificativas', value: invoices?.filter(i => i.invoice_type === 'R').length ?? 0 },
          { label: 'Total facturado', value: `${(invoices?.filter(i => i.status === 'issued').reduce((s, i) => s + (parseFloat(String(i.total)) || 0), 0) ?? 0).toFixed(2)} €` },
        ].map(stat => (
          <div key={stat.label} className="p-4" style={{ border: '1px solid #E5E7EB' }}>
            <p className="font-mono text-[10px]" style={{ color: '#6B7280' }}>{stat.label}</p>
            <p className="font-display text-lg mt-1" style={{ color: '#000000' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      <div style={{ border: '1px solid #E5E7EB' }}>
        <div className="grid grid-cols-7 gap-0 px-4 py-3" style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          {['Nº Factura', 'Tipo', 'Cliente', 'NIF', 'Total', 'Origen', 'Estado'].map(h => (
            <p key={h} className="font-mono text-[10px]" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>{h}</p>
          ))}
        </div>
        {(invoices ?? []).length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-mono text-xs" style={{ color: '#9CA3AF' }}>No hay facturas todavía</p>
            <p className="font-mono text-[10px] mt-1" style={{ color: '#D1D5DB' }}>Las facturas se generan desde Pedidos o Ventas POS</p>
          </div>
        ) : (
          (invoices ?? []).map(inv => (
            <div key={inv.id} className="grid grid-cols-7 gap-0 px-4 py-3 items-center" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <p className="font-mono text-xs font-bold" style={{ color: '#000000' }}>{inv.invoice_number}</p>
              <span className="font-mono text-[10px] px-1.5 py-0.5 inline-block" style={{ backgroundColor: inv.invoice_type === 'R' ? '#FEF3C7' : '#F3F4F6', color: '#000000' }}>
                {inv.invoice_type === 'R' ? 'Rectificativa' : 'Normal'}
              </span>
              <p className="font-mono text-xs truncate" style={{ color: '#000000' }}>{inv.customer_name || '—'}</p>
              <p className="font-mono text-xs" style={{ color: '#6B7280' }}>{inv.customer_nif || '—'}</p>
              <p className="font-mono text-xs font-bold" style={{ color: '#000000' }}>{parseFloat(String(inv.total)).toFixed(2)} €</p>
              <span className="font-mono text-[10px] px-1.5 py-0.5 inline-block" style={{ backgroundColor: inv.source_type === 'pos_sale' ? '#DBEAFE' : '#F3E8FF', color: '#000000' }}>
                {inv.source_type === 'pos_sale' ? 'POS' : 'Online'}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 inline-block" style={{
                backgroundColor: inv.status === 'issued' ? '#F0FDF4' : inv.status === 'cancelled' ? '#FEF2F2' : '#F9FAFB',
                color: inv.status === 'issued' ? '#16A34A' : inv.status === 'cancelled' ? '#DC2626' : '#6B7280',
              }}>
                {inv.status === 'issued' ? 'Emitida' : inv.status === 'cancelled' ? 'Anulada' : inv.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
