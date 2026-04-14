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
  const [form, setForm] = useState({ date: '', type: 'DJ SET', title: '', venue: '', lineup: '', flyer_url: '', web: '' })

  // Helper para autorización
  const getAuthHeaders = () => {
    const secret = localStorage.getItem('rc_admin_secret') || '' // En producción usar contexto/cookie
    // Para simplificar la demo, pediremos el secret una vez
    const adminSecret = prompt("Introduce el ADMIN_SECRET para continuar:")
    if (!adminSecret) return null
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminSecret}` }
  }

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    setLoading(true)
    // GET es público según nuestra política SQL, pero la API comprueba auth. 
    // Para ver la lista sin auth, modificaremos la API GET para permitirlo, o usaremos el secret guardado.
    // Asumimos que la lista es visible, pero la API actual requiere auth.
    const headers = getAuthHeaders()
    if(!headers) { setLoading(false); return }
    
    const res = await fetch('/api/admin/events', { headers })
    const data = await res.json()
    if (res.ok) setEvents(data || [])
    else setMsg(`Error: ${data.error}`)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ date: '', type: 'DJ SET', title: '', venue: '', lineup: '', flyer_url: '', web: '' })
    setEditing(null)
    setMsg(null)
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
    
    // Pedir secret si no está guardado (simplificación para demo)
    const secret = prompt("Confirma tu ADMIN_SECRET para guardar:")
    if(!secret) { setSaving(false); return }

    const payload = { ...form, lineup: form.lineup.split(',').map(s => s.trim()).filter(Boolean) }
    const url = editing ? `/api/admin/events/${editing.id}` : '/api/admin/events'
    const method = editing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    
    if (res.ok) {
      setMsg(`✓ Evento ${editing ? 'actualizado' : 'creado'}`)
      resetForm()
      fetchEvents()
    } else {
      setMsg(`✕ Error: ${data.error}`)
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
    const secret = prompt("Confirma ADMIN_SECRET para borrar:")
    if(!secret) return

    const res = await fetch(`/api/admin/events/${id}`, { 
      method: 'DELETE', 
      headers: { 'Authorization': `Bearer ${secret}` } 
    })
    if (res.ok) fetchEvents()
    else alert('Error al borrar')
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto bg-white text-black min-h-screen">
      <header className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
        <Link href="/admin" className="font-display text-xs hover:underline">← VOLVER</Link>
        <h1 className="font-display text-2xl uppercase">GESTIÓN AGENDA</h1>
        <div />
      </header>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 p-6 border-2 border-black">
        <h2 className="font-display text-lg col-span-full">{editing ? 'EDITAR EVENTO' : 'NUEVO EVENTO'}</h2>
        
        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="border-2 border-black p-2 font-mono text-xs bg-white" required />
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="border-2 border-black p-2 font-display text-xs bg-white">
          <option>DJ SET</option><option>LIVE</option><option>SESIÓN</option><option>ALL NIGHT</option>
        </select>
        
        <input type="text" placeholder="TÍTULO" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="border-2 border-black p-2 font-display text-xs col-span-full" required />
        <input type="text" placeholder="VENUE" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className="border-2 border-black p-2 font-mono text-xs" />
        <input type="text" placeholder="LINEUP (separado por comas)" value={form.lineup} onChange={e => setForm(f => ({ ...f, lineup: e.target.value }))} className="border-2 border-black p-2 font-mono text-xs" />
        
        <div className="col-span-full">
          <label className="font-display text-xs block mb-1">FLYER (Subir Imagen)</label>
          <input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="border-2 border-black p-2 font-mono text-xs w-full" />
          {/* Preview de la imagen Base64 */}
          {form.flyer_url && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 inline-block">
              <img src={form.flyer_url} alt="Preview" className="w-24 h-24 object-cover" />
            </div>
          )}
        </div>

        <input type="text" placeholder="WEB EVENTO (URL)" value={form.web} onChange={e => setForm(f => ({ ...f, web: e.target.value }))} className="border-2 border-black p-2 font-mono text-xs col-span-full" />

        <div className="col-span-full flex gap-4 items-center">
          <button type="submit" disabled={saving} className="font-display text-xs px-6 py-2 bg-black text-white hover:bg-[#F0E040] hover:text-black transition-colors disabled:opacity-50">
            {saving ? 'GUARDANDO...' : (editing ? 'ACTUALIZAR' : 'CREAR')}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="font-display text-xs px-6 py-2 border-2 border-black hover:bg-gray-100">
              CANCELAR
            </button>
          )}
          {msg && <span className="font-mono text-xs text-green-700">{msg}</span>}
        </div>
      </form>

      {/* Lista de Eventos */}
      <section>
        <h3 className="font-display text-lg mb-4">EVENTOS GUARDADOS</h3>
        {loading ? <p className="font-mono text-xs">Cargando...</p> : (
          <div className="overflow-x-auto border-2 border-black">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-black text-white">
                <tr>
                  <th className="font-display text-xs p-2">FECHA</th>
                  <th className="font-display text-xs p-2">EVENTO</th>
                  <th className="font-display text-xs p-2">FLYER</th>
                  <th className="font-display text-xs p-2 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="font-mono text-xs p-2">{new Date(ev.date).toLocaleDateString('es-ES')}</td>
                    <td className="p-2">
                      <p className="font-display text-sm uppercase">{ev.title}</p>
                      <p className="font-mono text-[10px] text-gray-600">{ev.type} @ {ev.venue}</p>
                    </td>
                    <td className="p-2">
                      {ev.flyer_url && <img src={ev.flyer_url} alt="Flyer" className="w-10 h-10 object-cover border" />}
                    </td>
                    <td className="p-2 text-right space-x-2">
                      <button onClick={() => handleEdit(ev)} className="font-display text-xs px-3 py-1 border border-black hover:bg-black hover:text-white">EDITAR</button>
                      <button onClick={() => handleDelete(ev.id)} className="font-display text-xs px-3 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white">X</button>
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
