'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function AdminResetPassword() {
  const router = useRouter()
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabaseRef.current = supabase

    async function exchangeCode() {
      // Strategy 1: PKCE code flow (recommended by Supabase for SSR)
      // Supabase sends ?code=xxx in the redirect URL
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError('Enlace inválido o expirado.')
            setVerifying(false)
            return
          }
          setReady(true)
          setVerifying(false)
          // Clean URL
          window.history.replaceState(null, '', window.location.pathname)
          return
        } catch {
          // Fall through to hash parsing
        }
      }

      // Strategy 2: Hash fragment flow (legacy, still used by password reset emails)
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type         = params.get('type')

      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (sessionError) {
            setError('Enlace inválido o expirado.')
            setVerifying(false)
            return
          }
          setReady(true)
          setVerifying(false)
          // Clean the hash from URL without reload
          window.history.replaceState(null, '', window.location.pathname)
          return
        } catch {
          setError('Enlace inválido o expirado.')
          setVerifying(false)
          return
        }
      }

      // Strategy 3: Listen for auth state change event
      // If the Supabase client already processed the hash before this component mounted
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true)
          setVerifying(false)
          window.history.replaceState(null, '', window.location.pathname)
        }
      })

      // Timeout: if no recovery event after 6 seconds, show error
      const timeout = setTimeout(() => {
        setError('Enlace inválido o expirado.')
        setVerifying(false)
      }, 6000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    }

    exchangeCode()
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Error al actualizar: ' + updateError.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.replace('/admin/login')
  }, [router])

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
        ) : verifying ? (
          <p className="text-xs text-center" style={{ color: '#6b7280' }}>Verificando enlace…</p>
        ) : !ready ? (
          <p className="text-xs text-center" style={{ color: '#6b7280' }}>Verificando enlace…</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="password" className="text-xs block mb-2" style={{ color: '#374151' }}>NUEVA CONTRASEÑA</label>
              <input
                id="password" name="password" type="password"
                required minLength={6} autoFocus
                autoComplete="new-password"
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
                autoComplete="new-password"
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
