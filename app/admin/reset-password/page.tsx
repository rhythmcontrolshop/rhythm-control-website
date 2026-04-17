'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function AdminResetPassword() {
  const router = useRouter()
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabaseRef.current = supabase

    // @supabase/ssr no procesa el hash automáticamente — hay que hacerlo a mano
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type         = params.get('type')

    if (type === 'recovery' && accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setError('Enlace inválido o expirado.')
          } else {
            setReady(true)
            // Limpiar el hash de la URL sin recargar
            window.history.replaceState(null, '', window.location.pathname)
          }
        })
    } else {
      // Fallback: escuchar el evento por si el cliente lo procesa solo
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })

      const timeout = setTimeout(() => {
        setError('Enlace inválido o expirado.')
      }, 6000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const password        = (form.elements.namedItem('password')        as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    const supabase = supabaseRef.current
    if (!supabase) { setError('Error interno. Recarga la página.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Error al actualizar: ' + error.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="w-full max-w-xs">

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>RHYTHM CONTROL</h1>
          <p className="text-xs mt-2" style={{ color: '#6b7280' }}>NUEVA CONTRASEÑA</p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2rem' }} />

        {error ? (
          <div className="text-center">
            <p className="text-xs mb-6" style={{ color: '#ef4444' }}>{error}</p>
            <a href="/admin/recover" className="text-xs underline" style={{ color: '#6b7280' }}>
              Solicitar nuevo enlace
            </a>
          </div>
        ) : !ready ? (
          <p className="text-xs text-center" style={{ color: '#6b7280' }}>Verificando enlace…</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="password" className="text-xs block mb-2" style={{ color: '#374151' }}>NUEVA CONTRASEÑA</label>
              <input
                id="password" name="password" type="password"
                required minLength={6} autoFocus
                placeholder="Mínimo 6 caracteres"
                className="w-full text-sm px-4 py-3 focus:outline-none"
                style={{ border: '1px solid #d1d5db', color: '#000000' }}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-xs block mb-2" style={{ color: '#374151' }}>CONFIRMAR CONTRASEÑA</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password"
                required minLength={6}
                placeholder="Repite la contraseña"
                className="w-full text-sm px-4 py-3 focus:outline-none"
                style={{ border: '1px solid #d1d5db', color: '#000000' }}
              />
            </div>

            {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full text-sm py-3 transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
            >
              {loading ? 'GUARDANDO…' : 'GUARDAR NUEVA CONTRASEÑA'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/admin/login" className="text-xs underline hover:opacity-60" style={{ color: '#6b7280' }}>
            ← Volver al login
          </a>
        </div>
      </div>
    </main>
  )
}
