'use client'
import { useState, useEffect } from 'react'

interface CustomerRow {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  phone: string | null
  city: string | null
  country: string | null
  address: string | null
  postal_code: string | null
  created_at: string
  order_count: number
  total_spent: number
}

interface EditForm {
  full_name: string
  phone: string
  address: string
  city: string
  postal_code: string
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [form, setForm] = useState<EditForm>({ full_name: '', phone: '', address: '', city: '', postal_code: '' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/customers', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      }
    } catch {}
    setLoading(false)
  }

  const openEdit = (c: CustomerRow) => {
    setSelected(c)
    setForm({
      full_name: c.full_name || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      postal_code: c.postal_code || '',
    })
    setEditError(null)
  }

  const closeEdit = () => {
    setSelected(null)
    setEditError(null)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    setEditError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: selected.id, ...form }),
      })
      const data = await res.json()
      if (res.ok) {
        setCustomers(prev => prev.map(c =>
          c.id === selected.id ? { ...c, ...form } : c
        ))
        closeEdit()
      } else {
        setEditError(data.error || 'Error al guardar')
      }
    } catch {
      setEditError('Error de conexión')
    }
    setSaving(false)
  }

  const displayName = (c: CustomerRow) =>
    c.full_name || (c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : c.username || '—')

  return (
    <div className="p-6">
      {/* Slide-over */}
      {selected && (
        <>
          <div
            onClick={closeEdit}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          />
          <div style={{ position: 'fixed', top: 0, right: 0, height: '100%', width: '420px', maxWidth: '100vw', backgroundColor: '#FFFFFF', zIndex: 50, overflowY: 'auto', padding: '1.5rem', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <h2 className="text-sm font-bold" style={{ color: '#000000' }}>EDITAR CLIENTE</h2>
              <button
                onClick={closeEdit}
                style={{ color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none' }}
                className="text-xs hover:underline"
              >
                ✕ CERRAR
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
                <p className="text-xs" style={{ color: '#ef4444' }}>{editError}</p>
              </div>
            )}

            {/* Email read-only */}
            <div className="mb-4">
              <label className="text-xs font-bold block mb-1" style={{ color: '#6b7280' }}>EMAIL (solo lectura)</label>
              <input
                type="text"
                value={selected.email}
                readOnly
                className="w-full text-sm px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #d1d5db', color: '#6b7280', backgroundColor: '#f9fafb' }}
              />
            </div>

            {([
              { key: 'full_name', label: 'NOMBRE COMPLETO' },
              { key: 'phone', label: 'TELÉFONO' },
              { key: 'address', label: 'DIRECCIÓN' },
              { key: 'city', label: 'CIUDAD' },
              { key: 'postal_code', label: 'CÓDIGO POSTAL' },
            ] as { key: keyof EditForm; label: string }[]).map(({ key, label }) => (
              <div key={key} className="mb-4">
                <label className="text-xs font-bold block mb-1" style={{ color: '#000000' }}>{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full text-sm px-3 py-2 focus:outline-none"
                  style={{ border: '1px solid #d1d5db', color: '#000000' }}
                />
              </div>
            ))}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs px-8 py-3 transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer', border: 'none' }}
              >
                {saving ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
              <button
                onClick={closeEdit}
                className="text-xs px-6 py-3 transition-colors"
                style={{ border: '1px solid #d1d5db', color: '#000000', cursor: 'pointer', background: 'none' }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-6" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>CLIENTES</h1>
        <p className="text-xs" style={{ color: '#6b7280' }}>{customers.length} registrados</p>
      </div>

      {loading ? (
        <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>Cargando...</p>
      ) : customers.length === 0 ? (
        <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>No hay clientes registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '2px solid #000000' }}>
                {['CLIENTE', 'EMAIL', 'TELÉFONO', 'DIRECCIÓN', 'CIUDAD', 'PEDIDOS', 'TOTAL GASTADO', 'REGISTRADO', ''].map((h, i) => (
                  <th key={i} className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="px-3 py-3">
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>{displayName(c)}</p>
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>{c.email}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>{c.phone || '—'}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {c.address ? `${c.address}${c.postal_code ? `, ${c.postal_code}` : ''}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#000000' }}>
                    {c.city ? `${c.city}${c.country ? `, ${c.country}` : ''}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>{c.order_count}</td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                    {c.total_spent.toFixed(2)} €
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {new Date(c.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-xs px-3 py-1 transition-colors hover:opacity-80"
                      style={{ border: '1px solid #000000', color: '#000000', cursor: 'pointer', background: 'none' }}
                    >
                      EDITAR
                    </button>
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
