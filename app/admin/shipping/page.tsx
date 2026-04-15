'use client'

import { useState, useEffect, useCallback } from 'react'

interface ShippingRate {
  id: string; name: string; description: string | null; zone: string; method: string
  carrier: string | null; min_weight_kg: number; max_weight_kg: number; price: number
  free_above: number | null; is_active: boolean; sort_order: number
}

const ZONE_OPTIONS = [
  { value: 'es_barcelona', label: 'Barcelona' },
  { value: 'es_peninsula', label: 'España Península' },
  { value: 'es_baleares', label: 'Baleares' },
  { value: 'es_canarias', label: 'Canarias' },
  { value: 'pt', label: 'Portugal' },
  { value: 'eu', label: 'UE' },
  { value: 'international', label: 'Internacional' },
]

const METHOD_OPTIONS = [
  { value: 'click_collect', label: 'Guardi (Click & Collect)' },
  { value: 'home_delivery', label: 'Domicilio' },
  { value: 'post_office', label: 'Oficina de correos' },
]

const EMPTY_FORM = {
  name: '', description: '', zone: 'es_peninsula', method: 'home_delivery',
  carrier: '', min_weight_kg: 0, max_weight_kg: 2, price: 0, free_above: 0, sort_order: 0,
}

export default function ShippingPage() {
  const [rates, setRates]         = useState<ShippingRate[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<ShippingRate | null>(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/shipping-rates')
    if (res.ok) setRates(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchRates() }, [fetchRates])

  function startEdit(rate: ShippingRate) {
    setEditing(rate)
    setForm({
      name: rate.name, description: rate.description || '', zone: rate.zone, method: rate.method,
      carrier: rate.carrier || '', min_weight_kg: rate.min_weight_kg, max_weight_kg: rate.max_weight_kg,
      price: rate.price, free_above: rate.free_above || 0, sort_order: rate.sort_order,
    })
    setShowForm(true)
  }

  function startCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const body = {
      ...form,
      carrier: form.carrier || null,
      description: form.description || null,
      free_above: form.free_above || null,
    }

    if (editing) {
      await fetch('/api/admin/shipping-rates', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...body }),
      })
    } else {
      await fetch('/api/admin/shipping-rates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setSaving(false); setShowForm(false); fetchRates()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta tarifa?')) return
    setDeleting(id)
    await fetch('/api/admin/shipping-rates', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null); fetchRates()
  }

  async function toggleActive(rate: ShippingRate) {
    await fetch('/api/admin/shipping-rates', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rate.id, is_active: !rate.is_active }),
    })
    fetchRates()
  }

  const zoneLabel = (z: string) => ZONE_OPTIONS.find(o => o.value === z)?.label ?? z
  const methodLabel = (m: string) => METHOD_OPTIONS.find(o => o.value === m)?.label ?? m

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>ENVIOS</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: '#6b7280' }}>{rates.length} tarifas</span>
          <button onClick={startCreate}
            className="text-xs px-4 py-2 transition-colors hover:opacity-90"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
            + NUEVA TARIFA
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ border: '2px solid #000000' }}>
          <h2 className="text-lg font-bold col-span-full" style={{ color: '#000000' }}>
            {editing ? 'EDITAR TARIFA' : 'NUEVA TARIFA'}
          </h2>

          <input type="text" required placeholder="Nombre *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />

          <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
            className="p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000', backgroundColor: '#FFF' }}>
            {ZONE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
            className="p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000', backgroundColor: '#FFF' }}>
            {METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <input type="text" placeholder="Transportista (TIPSA, Correos...)" value={form.carrier}
            onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))}
            className="p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />

          <div className="flex gap-2">
            <input type="number" step="0.1" placeholder="Peso min" value={form.min_weight_kg}
              onChange={e => setForm(f => ({ ...f, min_weight_kg: parseFloat(e.target.value) || 0 }))}
              className="flex-1 p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />
            <input type="number" step="0.1" placeholder="Peso max" value={form.max_weight_kg}
              onChange={e => setForm(f => ({ ...f, max_weight_kg: parseFloat(e.target.value) || 0 }))}
              className="flex-1 p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />
          </div>

          <input type="number" step="0.01" required placeholder="Precio EUR *" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
            className="p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />

          <input type="number" step="0.01" placeholder="Gratis desde (EUR)" value={form.free_above}
            onChange={e => setForm(f => ({ ...f, free_above: parseFloat(e.target.value) || 0 }))}
            className="p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />

          <input type="text" placeholder="Descripcion" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="p-2 text-sm focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />

          <div className="col-span-full flex gap-3 items-center mt-2">
            <button type="submit" disabled={saving}
              className="text-xs px-6 py-2 transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
              {saving ? 'GUARDANDO...' : (editing ? 'ACTUALIZAR' : 'CREAR')}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-xs px-6 py-2 transition-colors"
              style={{ border: '1px solid #d1d5db', color: '#374151' }}>
              CANCELAR
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-xs animate-pulse py-8 text-center" style={{ color: '#6b7280' }}>CARGANDO...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: '2px solid #000000' }}>
                {['NOMBRE', 'ZONA', 'METODO', 'TRANSPORTISTA', 'PESO', 'PRECIO', 'GRATIS DESDE', 'ESTADO', ''].map((h, i) => (
                  <th key={i} className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rates.map(rate => (
                <tr key={rate.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="px-3 py-3">
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>{rate.name}</p>
                    {rate.description && <p className="text-xs" style={{ color: '#6b7280' }}>{rate.description}</p>}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>{zoneLabel(rate.zone)}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>{methodLabel(rate.method)}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>{rate.carrier || '—'}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>{rate.min_weight_kg}-{rate.max_weight_kg} kg</td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>{rate.price.toFixed(2)} EUR</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>{rate.free_above ? `${rate.free_above.toFixed(2)} EUR` : '—'}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleActive(rate)}
                      className="text-xs px-2 py-1"
                      style={{ color: rate.is_active ? '#22c55e' : '#9ca3af', border: `1px solid ${rate.is_active ? '#22c55e' : '#9ca3af'}` }}>
                      {rate.is_active ? 'ACTIVA' : 'INACTIVA'}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(rate)}
                        className="text-xs px-2 py-1 transition-colors hover:bg-black hover:text-white"
                        style={{ border: '1px solid #d1d5db', color: '#374151' }}>EDITAR</button>
                      <button onClick={() => handleDelete(rate.id)} disabled={deleting === rate.id}
                        className="text-xs px-2 py-1 transition-colors hover:bg-red-500 hover:text-white"
                        style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
                        {deleting === rate.id ? '...' : 'X'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
