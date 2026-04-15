'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function ReservationActions({ reservationId, status }: { reservationId: string; status: string }) {
  const [loading, setLoading] = useState<'confirm' | 'collect' | 'cancel' | null>(null)
  const router = useRouter()
  async function act(action: 'confirm' | 'collect' | 'cancel') {
    setLoading(action as any)
    await fetch('/api/admin/reservations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reservationId, action }),
    })
    setLoading(null); router.refresh()
  }
  return (
    <div className="flex gap-2">
      {status === 'pending' && (
        <button onClick={() => act('confirm')} disabled={!!loading}
          className="text-xs px-3 py-2"
          style={{ backgroundColor: '#000000', color: '#FFFFFF', opacity: loading === 'confirm' ? 0.6 : 1 }}>
          {loading === 'confirm' ? '...' : 'CONFIRMAR'}
        </button>
      )}
      {status === 'confirmed' && (
        <button onClick={() => act('collect')} disabled={!!loading}
          className="text-xs px-3 py-2"
          style={{ backgroundColor: '#22c55e', color: '#FFFFFF', opacity: loading === 'collect' ? 0.6 : 1 }}>
          {loading === 'collect' ? '...' : 'RECOGIDO'}
        </button>
      )}
      <button onClick={() => act('cancel')} disabled={!!loading}
        className="text-xs px-3 py-2"
        style={{ border: '1px solid #ef4444', color: '#ef4444', opacity: loading === 'cancel' ? 0.6 : 1 }}>
        {loading === 'cancel' ? '...' : 'CANCELAR'}
      </button>
    </div>
  )
}
