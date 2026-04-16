'use client'

import { useState } from 'react'

interface Props {
  rateId: string
  isActive: boolean
  currentPrice: number
}

export default function ShippingActions({ rateId, isActive, currentPrice }: Props) {
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleActive() {
    setLoading('toggle')
    setError(null)
    try {
      const res = await fetch('/api/admin/shipping-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rateId, is_active: !isActive }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error de conexión' }))
        setError(data.error || 'Error al actualizar')
        return
      }
      window.location.reload()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta tarifa?')) return
    setLoading('delete')
    setError(null)
    try {
      const res = await fetch(`/api/admin/shipping-rates?id=${rateId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error de conexión' }))
        setError(data.error || 'Error al eliminar')
        return
      }
      window.location.reload()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleActive}
          disabled={!!loading}
          className="text-xs px-3 py-1 transition-opacity disabled:opacity-40"
          style={{
            border: `1px solid ${isActive ? '#d1d5db' : '#22c55e'}`,
            color: isActive ? '#6b7280' : '#22c55e',
            backgroundColor: '#FFFFFF',
          }}
        >
          {loading === 'toggle' ? '...' : isActive ? 'DESACTIVAR' : 'ACTIVAR'}
        </button>
        <button
          onClick={handleDelete}
          disabled={!!loading}
          className="text-xs px-2 py-1 transition-opacity disabled:opacity-40"
          style={{ border: '1px solid #ef4444', color: '#ef4444', backgroundColor: '#FFFFFF' }}
        >
          {loading === 'delete' ? '...' : 'X'}
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}
