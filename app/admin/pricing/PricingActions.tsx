'use client'

import { useState } from 'react'

interface Props {
  channelId: string
  currentCoefficient: number
  currentName: string
  isActive: boolean
}

export default function PricingActions({ channelId, currentCoefficient, currentName, isActive }: Props) {
  const [editing, setEditing] = useState(false)
  const [coefficient, setCoefficient] = useState(currentCoefficient.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const val = parseFloat(coefficient)
    if (isNaN(val) || val <= 0 || val > 5) {
      setError('Coeficiente debe ser entre 0.01 y 5')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/price-channels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: channelId, coefficient: val }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
      } else {
        setEditing(false)
        window.location.reload()
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.001"
          min="0.01"
          max="5"
          value={coefficient}
          onChange={e => setCoefficient(e.target.value)}
          className="text-xs px-2 py-1 w-20 focus:outline-none"
          style={{ border: '1px solid #d1d5db', color: '#000000', backgroundColor: '#FFFFFF' }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-3 py-1 transition-colors"
          style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
        >
          {saving ? '...' : 'OK'}
        </button>
        <button
          onClick={() => { setEditing(false); setError('') }}
          className="text-xs px-2 py-1 hover:bg-gray-100 transition-colors"
          style={{ border: '1px solid #d1d5db', color: '#6b7280' }}
        >
          X
        </button>
        {error && <span className="text-xs" style={{ color: '#ef4444' }}>{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs px-3 py-1 hover:bg-black hover:text-white transition-colors"
      style={{ border: '1px solid #d1d5db', color: '#6b7280' }}
    >
      EDITAR
    </button>
  )
}
