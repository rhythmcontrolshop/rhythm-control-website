'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Tab = 'discogs' | 'store' | 'legal' | 'stripe'

interface Setting {
  key: string; value: any; category: string; label: string; updated_at: string
}

export default function AjustesPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('discogs')
  const [edits, setEdits] = useState<Record<string, any>>({})

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setSettings(data || [])
        // Initialize edits from current values
        const init: Record<string, any> = {}
        for (const s of data || []) {
          init[s.key] = typeof s.value === 'string' ? s.value : JSON.stringify(s.value)
        }
        setEdits(init)
      }
    } catch { setError('Error de conexión') }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true); setMsg(null); setError(null)

    // Build changed settings
    const changed: { key: string; value: any }[] = []
    for (const s of settings) {
      const newVal = edits[s.key]
      const oldVal = typeof s.value === 'string' ? s.value : JSON.stringify(s.value)
      if (newVal !== undefined && newVal !== oldVal) {
        // Try to parse JSON, fall back to string
        let parsed: any = newVal
        try { parsed = JSON.parse(newVal) } catch { parsed = newVal }
        changed.push({ key: s.key, value: parsed })
      }
    }

    if (changed.length === 0) {
      setMsg('No hay cambios que guardar')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changed }),
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (res.ok) {
        setMsg(`${changed.length} ajuste(s) guardado(s)`)
        fetchSettings()
      } else {
        setError(data.error || 'Error al guardar')
      }
    } catch {
      setError('Error de conexión al guardar')
    }
    setSaving(false)
  }

  const filteredSettings = settings.filter(s => s.category === tab)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'discogs', label: 'DISCOGS' },
    { id: 'store', label: 'TIENDA' },
    { id: 'legal', label: 'LEGAL' },
    { id: 'stripe', label: 'STRIPE' },
  ]

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
        <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>AJUSTES</h1>
        <div />
      </div>

      {msg && <div className="mb-4 p-3" style={{ border: '1px solid #22c55e', backgroundColor: '#f0fdf4' }}><p className="text-xs" style={{ color: '#22c55e' }}>{msg}</p></div>}
      {error && <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}><p className="text-xs" style={{ color: '#ef4444' }}>{error}</p></div>}

      {/* Tabs */}
      <div className="flex gap-0 mb-8" style={{ borderBottom: '2px solid #000000' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="font-display text-xs px-6 py-3 transition-colors"
            style={{
              backgroundColor: tab === t.id ? '#000000' : '#FFFFFF',
              color: tab === t.id ? '#FFFFFF' : '#000000',
              borderRight: '1px solid #d1d5db',
              cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings form */}
      {loading ? (
        <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>Cargando...</p>
      ) : filteredSettings.length === 0 ? (
        <p className="text-xs" style={{ color: '#6b7280' }}>No hay ajustes para esta categoría.</p>
      ) : (
        <div className="space-y-4 mb-8">
          {filteredSettings.map(s => (
            <div key={s.key} className="p-4" style={{ border: '1px solid #d1d5db' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold" style={{ color: '#000000' }}>{s.label}</label>
                <span className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>{s.key}</span>
              </div>
              {/* Multiline for schedule/arrays, single line for others */}
              {(s.key === 'store_schedule' || String(edits[s.key] || '').length > 80) ? (
                <textarea
                  value={edits[s.key] ?? ''}
                  onChange={e => setEdits(prev => ({ ...prev, [s.key]: e.target.value }))}
                  rows={4}
                  className="w-full text-sm px-3 py-2 focus:outline-none font-mono resize-none"
                  style={{ border: '1px solid #d1d5db', color: '#000000' }}
                />
              ) : (
                <input
                  type={s.key.includes('token') || s.key.includes('password') ? 'password' : 'text'}
                  value={edits[s.key] ?? ''}
                  onChange={e => setEdits(prev => ({ ...prev, [s.key]: e.target.value }))}
                  className="w-full text-sm px-3 py-2 focus:outline-none font-mono"
                  style={{ border: '1px solid #d1d5db', color: '#000000' }}
                />
              )}
              {s.updated_at && (
                <p className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                  Última actualización: {new Date(s.updated_at).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="text-xs px-8 py-3 transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
        {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
      </button>

      {/* Help text per tab */}
      <div className="mt-10 p-6" style={{ border: '1px solid #e5e7eb' }}>
        {tab === 'discogs' && (
          <>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#000000' }}>CÓMO CONFIGURAR DISCOGS</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
              Para sincronizar tu inventario desde Discogs, necesitas:
            </p>
            <ol className="text-xs leading-relaxed mt-2 space-y-1" style={{ color: '#6b7280', listStyleType: 'decimal', paddingLeft: '1.5rem' }}>
              <li>Ir a <a href="https://www.discogs.com/settings/developers" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#3b82f6' }}>Discogs Developer Settings</a></li>
              <li>Generar un <strong>Personal Access Token</strong></li>
              <li>Introducir tu nombre de usuario y el token aquí</li>
              <li>Pulsa &quot;GUARDAR CAMBIOS&quot; y luego ve a <Link href="/admin/discogs" className="underline" style={{ color: '#3b82f6' }}>Discogs Sync</Link> para iniciar la sincronización</li>
            </ol>
          </>
        )}
        {tab === 'store' && (
          <>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#000000' }}>INFORMACIÓN DE LA TIENDA</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
              Estos valores se usan en el footer, la página de contacto y los textos legales.
              El horario debe ser un array JSON, por ejemplo: [&quot;LUN 15:00–19:45&quot;, &quot;MAR 15:00–19:45&quot;, ...].
            </p>
          </>
        )}
        {tab === 'legal' && (
          <>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#000000' }}>TEXTOS LEGALES</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
              Edita aquí los textos introductorios de cada documento legal. Los cambios se reflejarán
              en las páginas de Aviso Legal, Privacidad, Cookies y Términos. Los textos deben ir entre comillas dobles.
            </p>
          </>
        )}
        {tab === 'stripe' && (
          <>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#000000' }}>CONFIGURACIÓN DE STRIPE</h3>
            <p className="text-xs leading-relaxed mb-3" style={{ color: '#6b7280' }}>
              Para que los pagos se registren automáticamente, necesitas configurar un Webhook en el dashboard de Stripe.
              Sin el webhook, los pedidos se crearán pero no se actualizarán a &quot;pagado&quot; automáticamente.
            </p>
            <ol className="text-xs leading-relaxed mt-2 space-y-2" style={{ color: '#6b7280', listStyleType: 'decimal', paddingLeft: '1.5rem' }}>
              <li>Ir a <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#3b82f6' }}>Stripe Dashboard → Webhooks</a></li>
              <li>Pulsa <strong>&quot;Add endpoint&quot;</strong></li>
              <li>URL del endpoint: <code className="px-1 py-0.5" style={{ backgroundColor: '#f3f4f6', fontFamily: 'monospace' }}>{typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/stripe` : 'https://TU-DOMINIO/api/webhooks/stripe'}</code></li>
              <li>Eventos a escuchar: <code className="px-1 py-0.5" style={{ backgroundColor: '#f3f4f6', fontFamily: 'monospace' }}>checkout.session.completed</code>, <code className="px-1 py-0.5" style={{ backgroundColor: '#f3f4f6', fontFamily: 'monospace' }}>checkout.session.expired</code>, <code className="px-1 py-0.5" style={{ backgroundColor: '#f3f4f6', fontFamily: 'monospace' }}>payment_intent.payment_failed</code>, <code className="px-1 py-0.5" style={{ backgroundColor: '#f3f4f6', fontFamily: 'monospace' }}>charge.refunded</code>, <code className="px-1 py-0.5" style={{ backgroundColor: '#f3f4f6', fontFamily: 'monospace' }}>charge.dispute.created</code></li>
              <li>Copia el <strong>Signing secret</strong> y configúralo como variable de entorno <code className="px-1 py-0.5" style={{ backgroundColor: '#f3f4f6', fontFamily: 'monospace' }}>STRIPE_WEBHOOK_SECRET</code> en Vercel</li>
            </ol>
            <div className="mt-4 p-3" style={{ border: '1px solid #f59e0b', backgroundColor: '#fffbeb' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#92400e' }}>SINCRONIZACIÓN MANUAL</p>
              <p className="text-xs" style={{ color: '#92400e' }}>
                Si el webhook no está configurado, puedes usar el botón <strong>&quot;SYNC STRIPE&quot;</strong> en la página de Pedidos para sincronizar manualmente el estado de los pagos.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
