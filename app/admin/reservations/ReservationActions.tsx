'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function ReservationActions({ reservationId }: { reservationId: string }) {
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null)
  const router = useRouter()
  async function act(action: 'confirm' | 'cancel') {
    setLoading(action)
    await fetch('/api/admin/reservations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reservationId, action }),
    })
    setLoading(null); router.refresh()
  }
  return (
    <div className="flex gap-2">
      <button onClick={() => act('confirm')} disabled={!!loading}
        className="font-display text-xs px-3 py-2"
        style={{ backgroundColor: '#22c55e', color: '#000', opacity: loading === 'confirm' ? 0.6 : 1 }}>
        {loading === 'confirm' ? '...' : 'CONFIRMAR'}
      </button>
      <button onClick={() => act('cancel')} disabled={!!loading}
        className="font-display text-xs px-3 py-2"
        style={{ border: '1px solid #ef4444', color: '#ef4444', opacity: loading === 'cancel' ? 0.6 : 1 }}>
        {loading === 'cancel' ? '...' : 'CANCELAR'}
      </button>
    </div>
  )
}
