'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function InventoryActions({ releaseId, currentStatus }: { releaseId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const router = useRouter()
  async function updateStatus(status: string) {
    setLoading(true)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false); setConfirm(false); router.refresh()
  }
  if (currentStatus === 'gifted' || currentStatus === 'sold') return null
  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'active' && (confirm ? (
        <>
          <button onClick={() => updateStatus('gifted')} disabled={loading}
            className="font-display text-xs px-3 py-1"
            style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
            {loading ? '...' : '¿CONFIRMAR?'}
          </button>
          <button onClick={() => setConfirm(false)}
            className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>cancelar</button>
        </>
      ) : (
        <button onClick={() => setConfirm(true)}
          className="font-display text-xs px-3 py-1"
          style={{ border: '1px solid #333', color: 'var(--rc-color-muted)' }}>REGALAR</button>
      ))}
    </div>
  )
}
