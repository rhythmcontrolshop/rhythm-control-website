'use client'
// components/admin/BarcodeScanner.tsx
// Escáner de código de barras usando la cámara del dispositivo.
// Usa @zxing/browser — solo disponible en el cliente (dynamic import en el parent).
// Tema admin B/N: blanco sobre negro invertido.

import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react'
import type { IScannerControls } from '@zxing/browser'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [ready,   setReady]   = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [manual,  setManual]  = useState('')
  const [lastScan, setLastScan] = useState<string | null>(null)

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return

    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()

      const controls = await reader.decodeFromVideoDevice(
        undefined,        // dispositivo por defecto
        videoRef.current,
        (result) => {
          if (!result) return
          const text = result.getText()
          // Evitar disparar el mismo código múltiples veces seguidas
          if (text === lastScan) return
          setLastScan(text)
          onScan(text)
        }
      )

      controlsRef.current = controls
      setReady(true)
    } catch {
      setCamError('No se pudo acceder a la cámara. Activa los permisos en el navegador.')
    }
  }, [onScan, lastScan])

  useEffect(() => {
    startScanner()
    return () => {
      controlsRef.current?.stop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    const code = manual.trim()
    if (code) {
      onScan(code)
      setManual('')
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Visor de cámara */}
      <div
        className="relative overflow-hidden"
        style={{
          border:      '1px solid #d1d5db',
          aspectRatio: '4/3',
          backgroundColor: '#f9fafb',
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Estado: iniciando */}
        {!ready && !camError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>
              INICIANDO CÁMARA...
            </p>
          </div>
        )}

        {/* Línea guía de escaneo */}
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-3/4"
              style={{ height: '2px', backgroundColor: '#000000', opacity: 0.6 }}
            />
          </div>
        )}
      </div>

      {/* Error de cámara */}
      {camError && (
        <p className="text-xs text-center" style={{ color: '#ef4444' }}>{camError}</p>
      )}

      {/* Separador */}
      <div className="flex items-center gap-4">
        <hr className="flex-1" style={{ borderColor: '#e5e7eb' }} />
        <span className="text-xs" style={{ color: '#6b7280' }}>
          O
        </span>
        <hr className="flex-1" style={{ borderColor: '#e5e7eb' }} />
      </div>

      {/* Entrada manual */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          value={manual}
          onChange={e => setManual(e.target.value)}
          placeholder="Introduce EAN / UPC manualmente"
          className="flex-1 text-sm px-3 py-2 focus:outline-none"
          style={{
            border: '1px solid #d1d5db',
            color:  '#000000',
            backgroundColor: '#FFFFFF',
          }}
        />
        <button
          type="submit"
          className="text-xs px-4 py-2 transition-colors hover:opacity-80"
          style={{
            backgroundColor: '#000000',
            color:           '#FFFFFF',
          }}
        >
          BUSCAR
        </button>
      </form>

    </div>
  )
}
