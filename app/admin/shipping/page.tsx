'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ShippingActions from './ShippingActions'

interface ShippingRate {
  id: string
  name: string
  description: string | null
  zone: string
  method: string
  carrier: string | null
  min_weight_kg: number
  max_weight_kg: number
  price: number
  free_above: number | null
  is_active: boolean
  sort_order: number
}

type FormMode = 'create' | 'edit' | null

const ZONE_OPTIONS = [
  { value: 'es_peninsula', label: 'España Península' },
  { value: 'canarias', label: 'Canarias' },
  { value: 'baleares', label: 'Baleares' },
  { value: 'international', label: 'Internacional' },
]

const METHOD_OPTIONS = [
  { value: 'home_delivery', label: 'Domicilio' },
  { value: 'pickup', label: 'Recogida' },
]

const ZONE_LABELS: Record<string, string> = {
  es_peninsula: 'Península',
  canarias: 'Canarias',
  es_canarias: 'Canarias',
  baleares: 'Baleares',
  es_baleares: 'Baleares',
  es_barcelona: 'Barcelona',
  pt: 'Portugal',
  eu: 'UE',
  international: 'Internacional',
}

const emptyForm = {
  name: '',
  price: '',
  method: 'home_delivery',
  zone: 'es_peninsula',
  carrier: '',
  free_above: '',
  is_active: true,
}

export default function ShippingPage() {
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [mode, setMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => { fetchRates() }, [])

  const fetchRates = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/shipping-rates', { credentials: 'same-origin' })
      if (res.ok) {
        const json = await res.json()
        setRates(json.data || [])
      } else {
        setFetchError('Error al cargar tarifas')
      }
    } catch {
      setFetchError('Error de conexión')
    }
    setLoading(false)
  }

  const openCreate = () => {
    setMode('create')
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const openEdit = (rate: ShippingRate) => {
    setMode('edit')
    setEditingId(rate.id)
    setForm({
      name: rate.name,
      price: String(rate.price),
      method: rate.method,
      zone: rate.zone,
      carrier: rate.carrier || '',
      free_above: rate.free_above != null ? String(rate.free_above) : '',
      is_active: rate.is_active,
    })
    setFormError(null)
  }

  const closeForm = () => {
    setMode(null)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.method || !form.price) {
      setFormError('Nombre, método y precio son obligatorios')
      return
    }
    setSaving(true)
    setFormError(null)

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      price: Number(form.price),
      method: form.method,
      zone: form.zone,
      carrier: form.carrier.trim() || null,
      free_above: form.free_above === '' ? null : Number(form.free_above),
      is_active: form.is_active,
    }

    if (mode === 'edit' && editingId) {
      payload.id = editingId
    }

    try {
      const res = await fetch('/api/admin/shipping-rates', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      })
      const json = await res.json()
      if (res.ok) {
        if (mode === 'create') {
          setRates(prev => [...prev, json.data])
        } else {
          setRates(prev => prev.map(r => r.id === editingId ? json.data : r))
        }
        closeForm()
      } else {
        setFormError(json.error || 'Error al guardar')
      }
    } catch {
      setFormError('Error de conexión')
    }
    setSaving(false)
  }

  const handleToggled = (id: string, newActive: boolean) => {
    setRates(prev => prev.map(r => r.id === id ? { ...r, is_active: newActive } : r))
  }

  const handleDeleted = (id: string) => {
    setRates(prev => prev.filter(r => r.id !== id))
    if (editingId === id) closeForm()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Link href="/admin" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>TARIFAS DE ENVÍO</h1>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          {rates.length} tarifa{rates.length !== 1 ? 's' : ''}
        </p>
      </div>

      {fetchError && (
        <div className="mx-6 mt-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-xs" style={{ color: '#ef4444' }}>{fetchError}</p>
        </div>
      )}

      {/* Split view */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left column — rates list */}
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #e5e7eb', overflowY: 'auto' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={openCreate}
              className="text-xs px-4 py-2 w-full transition-colors"
              style={{
                backgroundColor: mode === 'create' ? '#000000' : '#FFFFFF',
                color: mode === 'create' ? '#FFFFFF' : '#000000',
                border: '1px solid #000000',
                cursor: 'pointer',
              }}
            >
              + NUEVA TARIFA
            </button>
          </div>

          {loading ? (
            <p className="text-xs animate-pulse px-4 py-4" style={{ color: '#6b7280' }}>Cargando...</p>
          ) : rates.length === 0 ? (
            <p className="text-xs px-4 py-4" style={{ color: '#6b7280' }}>No hay tarifas configuradas.</p>
          ) : (
            rates.map(rate => (
              <div
                key={rate.id}
                onClick={() => openEdit(rate)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  backgroundColor: editingId === rate.id ? '#f9fafb' : '#FFFFFF',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>{rate.name}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      {ZONE_LABELS[rate.zone] || rate.zone} · {rate.price.toFixed(2)} €
                    </p>
                  </div>
                  <span className="text-xs px-1.5 py-0.5"
                    style={{
                      flexShrink: 0,
                      color: rate.is_active ? '#22c55e' : '#9ca3af',
                      border: `1px solid ${rate.is_active ? '#22c55e' : '#9ca3af'}`,
                    }}>
                    {rate.is_active ? 'ACTIVA' : 'INACTIVA'}
                  </span>
                </div>
                {/* Stop click propagation so toggle/delete don't open the edit form */}
                <div onClick={e => e.stopPropagation()} className="mt-2">
                  <ShippingActions
                    rateId={rate.id}
                    isActive={rate.is_active}
                    currentPrice={rate.price}
                    onToggled={newActive => handleToggled(rate.id, newActive)}
                    onDeleted={() => handleDeleted(rate.id)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column — form or empty state */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {mode === null ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px' }}>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Selecciona una tarifa para editarla o pulsa + NUEVA TARIFA
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: '480px' }}>
              <h2 className="text-sm font-bold mb-6" style={{ color: '#000000' }}>
                {mode === 'create' ? 'NUEVA TARIFA' : 'EDITAR TARIFA'}
              </h2>

              {formError && (
                <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
                  <p className="text-xs" style={{ color: '#ef4444' }}>{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: '#000000' }}>NOMBRE *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }}
                    placeholder="Ej: Estándar Península"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: '#000000' }}>PRECIO (€) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: '#000000' }}>MÉTODO *</label>
                  <select
                    value={form.method}
                    onChange={e => setForm(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000', backgroundColor: '#FFFFFF' }}
                  >
                    {METHOD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: '#000000' }}>ZONA</label>
                  <select
                    value={form.zone}
                    onChange={e => setForm(prev => ({ ...prev, zone: e.target.value }))}
                    className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000', backgroundColor: '#FFFFFF' }}
                  >
                    {ZONE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: '#000000' }}>TRANSPORTISTA</label>
                  <input
                    type="text"
                    value={form.carrier}
                    onChange={e => setForm(prev => ({ ...prev, carrier: e.target.value }))}
                    className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }}
                    placeholder="Ej: Correos, SEUR..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: '#000000' }}>ENVÍO GRATIS DESDE (€)</label>
                  <input
                    type="number"
                    value={form.free_above}
                    onChange={e => setForm(prev => ({ ...prev, free_above: e.target.value }))}
                    className="w-full text-sm px-3 py-2 focus:outline-none"
                    style={{ border: '1px solid #d1d5db', color: '#000000' }}
                    placeholder="Dejar vacío si no aplica"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="is_active" className="text-xs font-bold" style={{ color: '#000000', cursor: 'pointer' }}>
                    ACTIVA
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs px-8 py-3 transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  {saving ? 'GUARDANDO...' : mode === 'create' ? 'CREAR TARIFA' : 'GUARDAR CAMBIOS'}
                </button>
                <button
                  onClick={closeForm}
                  disabled={saving}
                  className="text-xs px-4 py-3 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid #d1d5db', color: '#6b7280', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
