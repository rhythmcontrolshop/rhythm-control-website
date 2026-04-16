'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  email: string
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  tax_id?: string | null
}

export default function UpdateProfileForm({ profile }: { profile: Profile | null }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const hasData = profile?.first_name || profile?.last_name

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const form = new FormData(e.currentTarget)
    
    const res = await fetch('/api/cuenta/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'personal',
        username: form.get('username'),
        first_name: form.get('first_name'),
        last_name: form.get('last_name'),
        nif: form.get('nif'),
      })
    })

    setLoading(false)
    if (res.ok) {
      setSaved(true)
      setEditing(false)
      router.refresh()
    }
  }

  if (!editing && hasData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-meta text-xs mb-1" style={{ color: '#888' }}>NOMBRE</p>
            <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{profile?.first_name || '-'}</p>
          </div>
          <div>
            <p className="font-meta text-xs mb-1" style={{ color: '#888' }}>APELLIDOS</p>
            <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{profile?.last_name || '-'}</p>
          </div>
        </div>
        <div>
          <p className="font-meta text-xs mb-1" style={{ color: '#888' }}>EMAIL</p>
          <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{profile?.email}</p>
        </div>
        <div>
          <p className="font-meta text-xs mb-1" style={{ color: '#888' }}>NIF / DNI</p>
          <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{profile?.tax_id || '-'}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="font-display text-sm px-6 py-3 transition-colors hover:opacity-80"
          style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
        >
          EDITAR DATOS
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
          EMAIL
        </label>
        <input
          type="email"
          value={profile?.email || ''}
          disabled
          className="w-full bg-transparent font-meta text-sm px-4 py-3 opacity-50 cursor-not-allowed"
          style={{ border: '2px solid #333', color: '#FFFFFF' }}
        />
      </div>

      <div>
        <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
          NOMBRE DE USUARIO
        </label>
        <input
          name="username"
          type="text"
          defaultValue={profile?.username || ''}
          className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
          style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
          placeholder="Tu nombre público"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            NOMBRE *
          </label>
          <input
            name="first_name"
            type="text"
            required
            defaultValue={profile?.first_name || ''}
            className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
            placeholder="Juan"
          />
        </div>
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            APELLIDOS *
          </label>
          <input
            name="last_name"
            type="text"
            required
            defaultValue={profile?.last_name || ''}
            className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
            placeholder="Pérez García"
          />
        </div>
      </div>

      <div>
        <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
          NIF / DNI (opcional)
        </label>
        <input
          name="nif"
          type="text"
          defaultValue={profile?.tax_id || ''}
          className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
          style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
          placeholder="12345678A"
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="font-display text-sm px-6 py-3 transition-colors hover:opacity-80"
          style={{ backgroundColor: '#FFFFFF', color: '#000000', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'GUARDANDO...' : 'GUARDAR'}
        </button>
        {hasData && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="font-meta text-sm px-4 py-2"
            style={{ color: '#888' }}
          >
            Cancelar
          </button>
        )}
        {saved && (
          <p className="font-meta text-xs" style={{ color: '#22c55e' }}>
            Guardado correctamente
          </p>
        )}
      </div>
    </form>
  )
}
