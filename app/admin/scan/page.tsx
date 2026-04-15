'use client'
// app/admin/scan/page.tsx
// Escáner de código de barras para identificar discos vía cámara o entrada manual.

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

type PageState = 'scanning' | 'loading' | 'result' | 'error'

export default function ScanPage() {
  const [state,   setState]   = useState<PageState>('scanning')
  const [result,  setResult]  = useState<LookupResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [bpm,     setBpm]     = useState('')
  const [key,     setKey]     = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  async function handleScan(barcode: string) {
    setState('loading')

    const res  = await fetch(`/api/discogs/lookup?barcode=${encodeURIComponent(barcode)}`)
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
    setResult(null)
    setErrorMsg('')
    setBpm('')
    setKey('')
    setSaved(false)
    setState('scanning')
  }

  async function handleSaveBpmKey() {
    if (!result?.inventory?.id) return
    setSaving(true)

    const res = await fetch(`/api/admin/release/${result.inventory.id}/bpm-key`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        bpm: bpm ? parseInt(bpm, 10) : null,
        key: key || null,
      }),
    })

    setSaved(res.ok)
    setSaving(false)
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">

      <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
        ESCANEAR
      </h1>
      <p className="text-xs mb-8" style={{ color: '#6b7280' }}>
        Apunta la cámara al código de barras del disco o introdúcelo manualmente
      </p>

      {/* Escáner */}
      {state === 'scanning' && (
        <BarcodeScanner onScan={handleScan} />
      )}

      {/* Cargando */}
      {state === 'loading' && (
        <div
          className="flex items-center justify-center py-20"
          style={{ border: '1px solid #d1d5db' }}
        >
          <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>
            BUSCANDO EN DISCOGS...
          </p>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="py-10 text-center">
          <p className="text-sm mb-6" style={{ color: '#ef4444' }}>{errorMsg}</p>
          <button
            onClick={handleReset}
            className="text-xs px-6 py-3 transition-colors hover:bg-black hover:text-white"
            style={{ border: '1px solid #d1d5db', color: '#374151' }}
          >
            VOLVER A ESCANEAR
          </button>
        </div>
      )}

      {/* Resultado */}
      {state === 'result' && result && (
        <div className="flex flex-col gap-6">
          <ScanResult data={result} />

          {/* Editar BPM/Key si está en inventario */}
          {result.inventory && (
            <div style={{ border: '1px solid #d1d5db' }}>
              <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <p className="text-xs font-medium" style={{ color: '#000000' }}>
                  DATOS TÉCNICOS
                </p>
              </div>
              <div className="p-4 flex gap-4">
                <div className="flex-1">
                  <label className="text-xs block mb-2" style={{ color: '#6b7280' }}>
                    BPM
                  </label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={e => setBpm(e.target.value)}
                    placeholder="ej. 128"
                    className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs block mb-2" style={{ color: '#6b7280' }}>
                    KEY
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="ej. 4A / Am"
                    className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSaveBpmKey}
                    disabled={saving || saved}
                    className="text-xs px-4 py-2 transition-colors disabled:opacity-40"
                    style={{
                      backgroundColor: saved ? '#22c55e' : '#000000',
                      color: '#FFFFFF',
                    }}
                  >
                    {saving ? '...' : saved ? 'GUARDADO' : 'GUARDAR'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Acción: escanear otro */}
          <button
            onClick={handleReset}
            className="w-full text-xs py-3 transition-colors hover:bg-black hover:text-white"
            style={{ border: '1px solid #d1d5db', color: '#374151' }}
          >
            ESCANEAR OTRO
          </button>
        </div>
      )}

    </div>
  )
}

function ScannerPlaceholder() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        border:      '1px solid #d1d5db',
        aspectRatio: '4/3',
      }}
    >
      <p className="text-xs" style={{ color: '#6b7280' }}>
        CARGANDO ESCÁNER...
      </p>
    </div>
  )
}
