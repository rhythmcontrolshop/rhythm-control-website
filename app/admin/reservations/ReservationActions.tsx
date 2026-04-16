'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReservationActions({ reservationId, status }: { reservationId: string; status: string }) {
  const [loading, setLoading] = useState<'confirm' | 'collect' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function act(action: 'confirm' | 'collect' | 'cancel') {
    setLoading(action)
    setError(null)
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reservationId, action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error de conexión' }))
        setError(data.error || 'Error al actualizar')
        return
      }
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        {status === 'pending' && (
          <button onClick={() => act('confirm')} disabled={!!loading}
            className="text-xs px-3 py-2 transition-opacity"
            style={{ backgroundColor: '#000000', color: '#FFFFFF', opacity: loading === 'confirm' ? 0.6 : 1 }}>
            {loading === 'confirm' ? '...' : 'CONFIRMAR'}
          </button>
        )}
        {status === 'confirmed' && (
          <button onClick={() => act('collect')} disabled={!!loading}
            className="text-xs px-3 py-2 transition-opacity"
            style={{ backgroundColor: '#22c55e', color: '#FFFFFF', opacity: loading === 'collect' ? 0.6 : 1 }}>
            {loading === 'collect' ? '...' : 'RECOGIDO'}
          </button>
        )}
        {(status === 'pending' || status === 'confirmed') && (
          <button onClick={() => act('cancel')} disabled={!!loading}
            className="text-xs px-3 py-2 transition-opacity"
            style={{ border: '1px solid #ef4444', color: '#ef4444', opacity: loading === 'cancel' ? 0.6 : 1 }}>
            {loading === 'cancel' ? '...' : 'CANCELAR'}
          </button>
        )}
      </div>
      {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}
