'use client'
// app/admin/codigos/page.tsx
// Escáner de códigos de barras + generación + búsqueda manual.

import { useState }    from 'react'
import dynamic         from 'next/dynamic'
import ScanResult      from '@/components/admin/ScanResult'
import type { DiscogsSearchResult } from '@/lib/discogs/client'
import type { Release }              from '@/types'

// BarcodeScanner solo se renderiza en el cliente (usa APIs del navegador)
const BarcodeScanner = dynamic(
  () => import('@/components/admin/BarcodeScanner'),
  { ssr: false, loading: () => <ScannerPlaceholder /> }
)

interface LookupResult {
  discogs:       DiscogsSearchResult
  inventory:     Release | null
  total_results: number
  all_results:   DiscogsSearchResult[]
}

type TabState = 'scan' | 'search' | 'generate'
type PageState = 'idle' | 'loading' | 'result' | 'error'

export default function CodigosPage() {
  const [tab, setTab]             = useState<TabState>('scan')
  const [state, setState]         = useState<PageState>('idle')
  const [result, setResult]       = useState<LookupResult | null>(null)
  const [errorMsg, setErrorMsg]   = useState('')
  const [manualCode, setManualCode] = useState('')
  const [bpm, setBpm]             = useState('')
  const [key, setKey]             = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  async function handleLookup(code: string) {
    setState('loading')
    setErrorMsg('')
    const res  = await fetch(`/api/discogs/lookup?barcode=${encodeURIComponent(code)}`)
    const data = await res.json()
    if (res.ok) {
      setResult(data)
      setBpm(String(data.inventory?.bpm ?? ''))
      setKey(data.inventory?.key ?? '')
      setState('result')
    } else {
      setErrorMsg(data.error ?? 'Error al buscar el disco')
      setState('error')
    }
  }

  function handleReset() {
    setResult(null); setErrorMsg(''); setBpm(''); setKey(''); setSaved(false); setState('idle')
  }

  async function handleSaveBpmKey() {
    if (!result?.inventory?.id) return
    setSaving(true)
    const res = await fetch(`/api/admin/release/${result.inventory.id}/bpm-key`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bpm: bpm ? parseInt(bpm, 10) : null, key: key || null }),
    })
    setSaved(res.ok); setSaving(false)
  }

  const TABS: { key: TabState; label: string }[] = [
    { key: 'scan',     label: 'ESCANEAR' },
    { key: 'search',   label: 'BUSCAR' },
    { key: 'generate', label: 'GENERAR' },
  ]

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>CODIGOS</h1>
      <p className="text-xs mb-6" style={{ color: '#6b7280' }}>
        Escanea, busca o genera codigos de barras para tus discos
      </p>

      {/* Tabs */}
      <div className="flex gap-0 mb-8" style={{ borderBottom: '2px solid #000000' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); handleReset() }}
            className="text-xs px-5 py-3 transition-colors"
            style={{
              backgroundColor: tab === t.key ? '#000000' : 'transparent',
              color:           tab === t.key ? '#FFFFFF' : '#6b7280',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Escanear */}
      {tab === 'scan' && (
        <>
          {state === 'idle' && <BarcodeScanner onScan={handleLookup} />}
          {state === 'loading' && (
            <div className="flex items-center justify-center py-20" style={{ border: '1px solid #d1d5db' }}>
              <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>BUSCANDO EN DISCOGS...</p>
            </div>
          )}
        </>
      )}

      {/* TAB: Buscar manual */}
      {tab === 'search' && (
        <div className="flex gap-3 mb-6">
          <input
            type="text" value={manualCode} onChange={e => setManualCode(e.target.value)}
            placeholder="EAN-13, UPC o codigo interno"
            className="flex-1 text-sm px-3 py-2 focus:outline-none"
            style={{ border: '1px solid #d1d5db', color: '#000000' }}
            onKeyDown={e => { if (e.key === 'Enter' && manualCode.trim()) handleLookup(manualCode.trim()) }}
          />
          <button onClick={() => { if (manualCode.trim()) handleLookup(manualCode.trim()) }}
            className="text-xs px-6 py-2 transition-colors hover:opacity-90"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
            BUSCAR
          </button>
        </div>
      )}

      {/* TAB: Generar */}
      {tab === 'generate' && (
        <div className="p-6" style={{ border: '1px solid #d1d5db' }}>
          <p className="text-sm mb-4" style={{ color: '#000000' }}>
            Los codigos EAN-13 se generan automaticamente desde <b>Inventario</b> con el boton <code>+BC</code>.
          </p>
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Prefix: 200 (uso interno) + 9 digitos aleatorios + digito de control.
            Cada vinilo recibe un codigo unico vinculado a su release en la base de datos.
          </p>
          <a href="/admin/inventory"
            className="inline-block text-xs px-6 py-3 mt-6 transition-colors hover:opacity-90"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
            IR A INVENTARIO
          </a>
        </div>
      )}

      {/* Resultado (compartido por scan y search) */}
      {(state === 'result' || state === 'error') && (
        <div className="flex flex-col gap-6 mt-6">
          {state === 'error' && (
            <p className="text-sm" style={{ color: '#ef4444' }}>{errorMsg}</p>
          )}
          {state === 'result' && result && <ScanResult data={result} />}

          {result?.inventory && (
            <div style={{ border: '1px solid #d1d5db' }}>
              <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <p className="text-xs font-medium" style={{ color: '#000000' }}>DATOS TECNICOS</p>
              </div>
              <div className="p-4 flex gap-4">
                <div className="flex-1">
                  <label className="text-xs block mb-2" style={{ color: '#6b7280' }}>BPM</label>
                  <input type="number" value={bpm} onChange={e => setBpm(e.target.value)}
                    placeholder="ej. 128" className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }} />
                </div>
                <div className="flex-1">
                  <label className="text-xs block mb-2" style={{ color: '#6b7280' }}>KEY</label>
                  <input type="text" value={key} onChange={e => setKey(e.target.value)}
                    placeholder="ej. 4A / Am" className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }} />
                </div>
                <div className="flex items-end">
                  <button onClick={handleSaveBpmKey} disabled={saving || saved}
                    className="text-xs px-4 py-2 transition-colors disabled:opacity-40"
                    style={{ backgroundColor: saved ? '#22c55e' : '#000000', color: '#FFFFFF' }}>
                    {saving ? '...' : saved ? 'GUARDADO' : 'GUARDAR'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleReset}
            className="w-full text-xs py-3 transition-colors hover:bg-black hover:text-white"
            style={{ border: '1px solid #d1d5db', color: '#374151' }}>
            NUEVA BUSQUEDA
          </button>
        </div>
      )}
    </div>
  )
}

function ScannerPlaceholder() {
  return (
    <div className="flex items-center justify-center" style={{ border: '1px solid #d1d5db', aspectRatio: '4/3' }}>
      <p className="text-xs" style={{ color: '#6b7280' }}>CARGANDO ESCANER...</p>
    </div>
  )
}
