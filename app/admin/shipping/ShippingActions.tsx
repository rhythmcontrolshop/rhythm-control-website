'use client'

import { useState } from 'react'

interface Props {
  rateId: string
  isActive: boolean
  currentPrice: number
}

export default function ShippingActions({ rateId, isActive, currentPrice }: Props) {
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    setLoading(true)
    try {
      await fetch('/api/admin/shipping-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rateId, is_active: !isActive }),
      })
      window.location.reload()
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleActive}
        disabled={loading}
        className="text-xs px-3 py-1"
        style={{
          border: `1px solid ${isActive ? '#d1d5db' : '#22c55e'}`,
          color: isActive ? '#6b7280' : '#22c55e',
          backgroundColor: '#FFFFFF',
        }}
      >
        {loading ? '...' : isActive ? 'DESACTIVAR' : 'ACTIVAR'}
      </button>
    </div>
  )
}
