'use client'
// components/admin/SeedButton.tsx
// Solo visible en desarrollo. Inserta / limpia datos de muestra en Supabase.
// Tema admin B/N: blanco sobre negro invertido.

import { useState } from 'react'

export default function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function handleSeed() {
    setLoading(true)
    setMsg(null)
    setIsError(false)

    const res  = await fetch('/api/admin/seed', { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setMsg(`Insertados ${data.inserted} discos de muestra`)
    } else {
      setMsg(data.error ?? 'Error al insertar datos')
      setIsError(true)
    }
    setLoading(false)
  }

  async function handleClear() {
    setLoading(true)
    setMsg(null)

    const res  = await fetch('/api/admin/seed', { method: 'DELETE' })
    const data = await res.json()

    setMsg(res.ok ? 'Datos de muestra eliminados' : (data.error ?? 'Error'))
    setIsError(!res.ok)
    setLoading(false)
  }

  return (
    <div style={{ border: '1px solid #d1d5db' }}>
      <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <p className="text-xs font-medium" style={{ color: '#000000' }}>
          MODO DESARROLLO — DATOS DE MUESTRA
        </p>
        <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
          Inserta 10 discos ficticios en Supabase para probar el catálogo
        </p>
      </div>

      <div className="p-4 flex gap-3 flex-wrap">
        <button
          onClick={handleSeed}
          disabled={loading}
          className="text-xs px-4 py-2 transition-colors disabled:opacity-40"
          style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
        >
          {loading ? '...' : 'INSERTAR MUESTRA'}
        </button>

        <button
          onClick={handleClear}
          disabled={loading}
          className="text-xs px-4 py-2 transition-colors disabled:opacity-40 hover:bg-black hover:text-white"
          style={{ border: '1px solid #d1d5db', color: '#374151' }}
        >
          LIMPIAR
        </button>
      </div>

      {msg && (
        <p
          className="px-4 pb-4 text-xs"
          style={{ color: isError ? '#ef4444' : '#000000' }}
        >
          {msg}
        </p>
      )}
    </div>
  )
}
