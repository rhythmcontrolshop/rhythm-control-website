'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InventoryActionsProps {
  releaseId: string
  currentStatus: string
  barcode: string | null
  quantity: number
  location: string | null
}

export default function InventoryActions({ releaseId, currentStatus, barcode, quantity, location }: InventoryActionsProps) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState<'barcode' | 'quantity' | 'location' | null>(null)
  const [editValue, setEditValue] = useState('')
  const router = useRouter()

  async function updateStatus(status: string) {
    setLoading(true)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false); setConfirm(false); router.refresh()
  }

  async function updateField(field: string, value: string | number) {
    setLoading(true)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    setLoading(false); setEditing(null); router.refresh()
  }

  async function generateBarcode() {
    setLoading(true)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generate_barcode: true }),
    })
    setLoading(false); router.refresh()
  }

  if (currentStatus === 'sold') return null

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Botón de barcode */}
      {!barcode && (
        <button onClick={generateBarcode} disabled={loading}
          className="text-xs px-2 py-1"
          style={{ border: '1px solid #d1d5db', color: '#374151', backgroundColor: '#f9fafb' }}>
          {loading ? '...' : '+BC'}
        </button>
      )}
      {barcode && (
        <button onClick={() => { setEditing('barcode'); setEditValue(barcode) }}
          className="text-xs px-2 py-1"
          style={{ border: '1px solid #d1d5db', color: '#374151', backgroundColor: '#f9fafb' }}>
          BC
        </button>
      )}

      {/* Botón de cantidad */}
      <button onClick={() => { setEditing('quantity'); setEditValue(String(quantity)) }}
        className="text-xs px-2 py-1"
        style={{ border: '1px solid #d1d5db', color: '#374151', backgroundColor: '#f9fafb' }}>
        UDS
      </button>

      {/* Botón de ubicación */}
      <button onClick={() => { setEditing('location'); setEditValue(location || '') }}
        className="text-xs px-2 py-1"
        style={{ border: '1px solid #d1d5db', color: '#374151', backgroundColor: '#f9fafb' }}>
        UBIC
      </button>

      {/* Acción de regalar */}
      {currentStatus === 'active' && (confirm ? (
        <>
          <button onClick={() => updateStatus('gifted')} disabled={loading}
            className="text-xs px-2 py-1"
            style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
            {loading ? '...' : '¿CONFIRMAR?'}
          </button>
          <button onClick={() => setConfirm(false)}
            className="text-xs" style={{ color: '#9ca3af' }}>×</button>
        </>
      ) : (
        <button onClick={() => setConfirm(true)}
          className="text-xs px-2 py-1"
          style={{ border: '1px solid #d1d5db', color: '#6b7280' }}>REGALAR</button>
      ))}

      {/* Modal de edición inline */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 500 }}
          onClick={e => { if (e.target === e.currentTarget) setEditing(null) }}>
          <div className="p-6 w-full max-w-xs" style={{ backgroundColor: '#FFFFFF', border: '2px solid #000' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#000000' }}>
              {editing === 'barcode' ? 'CÓDIGO DE BARRAS' :
               editing === 'quantity' ? 'UNIDADES DISPONIBLES' : 'UBICACIÓN EN TIENDA'}
            </p>
            <input
              type={editing === 'quantity' ? 'number' : 'text'}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="w-full text-sm px-3 py-2 mb-4 focus:outline-none"
              style={{ border: '1px solid #d1d5db', color: '#000000' }}
              placeholder={
                editing === 'barcode' ? 'EAN-13 o código interno' :
                editing === 'quantity' ? '1' : 'Ej: Estantería B, Caja 3'
              }
              autoFocus
              min={editing === 'quantity' ? 0 : undefined}
            />
            <div className="flex gap-2">
              <button onClick={() => updateField(editing, editing === 'quantity' ? parseInt(editValue) || 0 : editValue)}
                disabled={loading}
                className="flex-1 text-sm py-2"
                style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
                {loading ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
              <button onClick={() => setEditing(null)}
                className="text-sm py-2 px-4"
                style={{ border: '1px solid #d1d5db', color: '#374151' }}>
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
