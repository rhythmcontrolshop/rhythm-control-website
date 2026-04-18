'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Event { id: string; date: string; type: string; title: string; venue: string; lineup: string[]; flyer_url: string; web: string }

export default function AgendaManager() {
  const [events, setEvents] = useState<Event[]>([])
  const [editing, setEditing] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [form, setForm] = useState({ date: '', type: 'DJ SET', title: '', venue: '', lineup: '', flyer_url: '', web: '' })

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/events', { credentials: 'same-origin' })
      if (res.status === 401) {
        setErrorMsg('Sesión expirada. Recarga la página para volver a iniciar sesión.')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (res.ok) {
        setEvents(data || [])
      } else {
        setErrorMsg(data.error || 'Error al cargar eventos')
      }
    } catch {
      setErrorMsg('Error de conexión al cargar eventos')
    }
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ date: '', type: 'DJ SET', title: '', venue: '', lineup: '', flyer_url: '', web: '' })
    setEditing(null)
    setMsg(null)
    setErrorMsg(null)
  }

  // Manejar subida de imagen a Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(f => ({ ...f, flyer_url: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    setErrorMsg(null)

    const payload = { ...form, lineup: form.lineup.split(',').map(s => s.trim()).filter(Boolean) }
    const url = editing ? `/api/admin/events/${editing.id}` : '/api/admin/events'
    const method = editing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      })
      const data = await res.json()

      if (res.ok) {
        setMsg(`Evento ${editing ? 'actualizado' : 'creado'}`)
        resetForm()
        fetchEvents()
      } else {
        setErrorMsg(data.error || 'Error al guardar')
      }
    } catch {
      setErrorMsg('Error de conexión al guardar')
    }
    setSaving(false)
  }

  const handleEdit = (event: Event) => {
    setEditing(event)
    setForm({
      date: event.date,
      type: event.type,
      title: event.title,
      venue: event.venue,
      lineup: event.lineup?.join(', ') || '',
      flyer_url: event.flyer_url || '',
      web: event.web || ''
    })
    window.scrollTo(0, 0)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE', credentials: 'same-origin' })
      if (res.ok) {
        fetchEvents()
      } else {
        const data = await res.json().catch(() => ({ error: 'Error al borrar' }))
        setErrorMsg(data.error || 'Error al borrar')
      }
    } catch {
      setErrorMsg('Error de conexión al borrar')
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
        <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>GESTIÓN AGENDA</h1>
        <div />
      </div>

      {/* Mensajes */}
      {msg && (
        <div className="mb-4 p-3" style={{ border: '1px solid #22c55e', backgroundColor: '#f0fdf4' }}>
          <p className="text-xs" style={{ color: '#22c55e' }}>{msg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-xs" style={{ color: '#ef4444' }}>{errorMsg}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 p-6" style={{ border: '1px solid #d1d5db' }}>
        <h2 className="text-lg font-bold col-span-full" style={{ color: '#000000' }}>{editing ? 'EDITAR EVENTO' : 'NUEVO EVENTO'}</h2>

        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="p-2 text-xs focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000', backgroundColor: '#FFFFFF' }} required />
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="p-2 text-xs focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000', backgroundColor: '#FFFFFF' }}>
          <option>DJ SET</option><option>LIVE</option><option>SESIÓN</option><option>ALL NIGHT</option>
        </select>

        <input type="text" placeholder="TÍTULO" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="p-2 text-xs col-span-full focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} required />
        <input type="text" placeholder="VENUE" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className="p-2 text-xs focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />
        <input type="text" placeholder="LINEUP (separado por comas)" value={form.lineup} onChange={e => setForm(f => ({ ...f, lineup: e.target.value }))} className="p-2 text-xs focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />

        <div className="col-span-full">
          <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>FLYER (Subir Imagen)</label>
          <input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="p-2 text-xs w-full focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />
          {form.flyer_url && (
            <div className="mt-2 p-2 inline-block" style={{ border: '1px solid #e5e7eb' }}>
              <img src={form.flyer_url} alt="Preview" className="w-24 h-24 object-cover" />
            </div>
          )}
        </div>

        <input type="text" placeholder="WEB EVENTO (URL)" value={form.web} onChange={e => setForm(f => ({ ...f, web: e.target.value }))} className="p-2 text-xs col-span-full focus:outline-none" style={{ border: '1px solid #d1d5db', color: '#000000' }} />

        <div className="col-span-full flex gap-4 items-center">
          <button type="submit" disabled={saving}
            className="text-xs px-6 py-2 transition-colors disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
            {saving ? 'GUARDANDO...' : (editing ? 'ACTUALIZAR' : 'CREAR')}
          </button>
          {editing && (
            <button type="button" onClick={resetForm}
              className="text-xs px-6 py-2 hover:bg-gray-100 transition-colors"
              style={{ border: '1px solid #d1d5db', color: '#374151' }}>
              CANCELAR
            </button>
          )}
        </div>
      </form>

      {/* Lista de Eventos */}
      <section>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>EVENTOS GUARDADOS</h3>
        {loading ? (
          <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>Cargando...</p>
        ) : events.length === 0 ? (
          <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
            <p className="text-xs" style={{ color: '#6b7280' }}>No hay eventos. Crea el primero arriba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ border: '1px solid #d1d5db' }}>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>FECHA</th>
                  <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>EVENTO</th>
                  <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>FLYER</th>
                  <th className="text-xs font-medium p-2 text-right" style={{ color: '#6b7280' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="p-2 text-xs" style={{ color: '#000000' }}>{new Date(ev.date).toLocaleDateString('es-ES')}</td>
                    <td className="p-2">
                      <p className="text-sm font-bold uppercase" style={{ color: '#000000' }}>{ev.title}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{ev.type} @ {ev.venue}</p>
                    </td>
                    <td className="p-2">
                      {ev.flyer_url && <img src={ev.flyer_url} alt="Flyer" className="w-10 h-10 object-cover" style={{ border: '1px solid #d1d5db' }} />}
                    </td>
                    <td className="p-2 text-right space-x-2">
                      <button onClick={() => handleEdit(ev)}
                        className="text-xs px-3 py-1 hover:bg-black hover:text-white transition-colors"
                        style={{ border: '1px solid #d1d5db', color: '#374151' }}>EDITAR</button>
                      <button onClick={() => handleDelete(ev.id)}
                        className="text-xs px-3 py-1 hover:bg-red-500 hover:text-white transition-colors"
                        style={{ border: '1px solid #ef4444', color: '#ef4444' }}>X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
