'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold mb-4" style={{ color: '#dc2626' }}>ERROR DEL PANEL</h1>
        <p className="text-xs mb-6" style={{ color: '#6b7280' }}>
          Ha ocurrido un error en el panel de administración. Los detalles han sido registrados.
        </p>
        <button
          onClick={reset}
          className="text-sm px-6 py-3 transition-colors hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
        >
          REINTENTAR
        </button>
        <div className="mt-4">
          <a href="/admin" className="text-xs underline" style={{ color: '#6b7280' }}>
            ← Volver al dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
