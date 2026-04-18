'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="es">
      <body style={{ backgroundColor: '#000000', color: '#FFFFFF', margin: 0, padding: 0, fontFamily: 'monospace' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#F0E040', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
              ERROR CRÍTICO
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '2rem' }}>
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <button
              onClick={reset}
              style={{ backgroundColor: '#F0E040', color: '#000000', padding: '0.75rem 2rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', border: 'none' }}
            >
              REINTENTAR
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
