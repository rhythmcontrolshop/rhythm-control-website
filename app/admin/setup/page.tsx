'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RhythmControlLogo from '@/components/ui/RhythmControlLogo'

export default function AdminSetupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    setError(null)

    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username: username || undefined }),
      })
      const data = await res.json()

      if (res.ok) {
        setMsg(data.message || 'Admin creado correctamente')
        // Redirect to admin login after 2 seconds
        setTimeout(() => router.push('/admin/login'), 2000)
      } else {
        setError(data.error || 'Error al crear el administrador')
      }
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <RhythmControlLogo height="40px" fill="#000000" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#000000' }}>
            CONFIGURACIÓN INICIAL
          </h1>
          <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
            Crea la primera cuenta de administrador para acceder al panel.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2rem' }} />

        {/* Info box */}
        <div className="mb-6 p-4" style={{ border: '1px solid #3b82f6', backgroundColor: '#eff6ff' }}>
          <p className="text-xs" style={{ color: '#1e40af' }}>
            Esta página solo aparece cuando no existe ningún administrador. Una vez creado el primer admin,
            podrás gestionar el equipo desde <strong>/admin/equipo</strong>.
          </p>
        </div>

        {msg && (
          <div className="mb-4 p-4" style={{ border: '1px solid #22c55e', backgroundColor: '#f0fdf4' }}>
            <p className="text-sm font-bold" style={{ color: '#22c55e' }}>{msg}</p>
            <p className="text-xs mt-1" style={{ color: '#166534' }}>Redirigiendo al login...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
            <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="text-xs block mb-2" style={{ color: '#374151' }}>
              EMAIL
            </label>
            <input
              id="email" name="email" type="email"
              required autoFocus autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full text-sm px-4 py-3 focus:outline-none"
              style={{ border: '1px solid #d1d5db', color: '#000000', letterSpacing: '0.07em' }}
              placeholder="admin@rhythmcontrol.es"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs block mb-2" style={{ color: '#374151' }}>
              CONTRASEÑA
            </label>
            <input
              id="password" name="password" type="password"
              required minLength={8} autoComplete="new-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full text-sm px-4 py-3 focus:outline-none"
              style={{ border: '1px solid #d1d5db', color: '#000000', letterSpacing: '0.07em' }}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label htmlFor="username" className="text-xs block mb-2" style={{ color: '#374151' }}>
              NOMBRE DE USUARIO (OPCIONAL)
            </label>
            <input
              id="username" name="username" type="text"
              autoComplete="username"
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full text-sm px-4 py-3 focus:outline-none"
              style={{ border: '1px solid #d1d5db', color: '#000000', letterSpacing: '0.07em' }}
              placeholder="Se usará el email si está vacío"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm py-3 transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}
          >
            {loading ? 'CREANDO...' : 'CREAR ADMINISTRADOR'}
          </button>
        </form>

        <p className="text-[10px] text-center mt-6" style={{ color: '#9ca3af' }}>
          Esta página se desactiva automáticamente después de crear el primer admin.
        </p>
      </div>
    </main>
  )
}
