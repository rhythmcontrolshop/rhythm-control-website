'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#000000' }}>
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl mb-6" style={{ color: '#F0E040' }}>ERROR</h1>
        <p className="text-sm mb-8" style={{ color: '#FFFFFF' }}>
          Algo ha salido mal. Inténtalo de nuevo.
        </p>
        <button
          onClick={reset}
          className="text-sm px-8 py-3 transition-colors hover:opacity-90"
          style={{ backgroundColor: '#F0E040', color: '#000000' }}
        >
          REINTENTAR
        </button>
        <div className="mt-6">
          <a href="/" className="text-xs underline" style={{ color: '#6b7280' }}>
            ← Volver al inicio
          </a>
        </div>
      </div>
    </main>
  )
}
