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

  useEffect(() => {
    const supabase = createClient()
    supabaseRef.current = supabase

    let settled = false

    async function checkSession() {
      // ── Strategy 1: Check if the Supabase client already has a recovery session ──
      // createBrowserClient auto-processes the hash fragment #access_token=...&type=recovery
      // on initialization, so by the time this runs, the session may already be set.
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // Check if this is a recovery session (user clicked password reset link)
          // The Supabase client sets the session from the hash automatically.
          // We verify it's valid by checking the token expiry.
          const tokenExp = session.expires_at ? session.expires_at * 1000 : 0
          const isExpired = tokenExp < Date.now()

          if (!isExpired) {
            // Session is valid — check if we arrived via a recovery link
            // by looking at the URL hash or search params
            const hash = window.location.hash
            const search = window.location.search
            const isRecoveryFlow = hash.includes('type=recovery') || search.includes('code=')

            if (isRecoveryFlow) {
              setReady(true)
              settled = true
              // Clean URL
              window.history.replaceState(null, '', window.location.pathname)
              return
            }
          }
        }
      } catch {
        // getSession failed, continue to other strategies
      }

      // ── Strategy 2: Listen for PASSWORD_RECOVERY event ──
      // The Supabase client fires this event when it processes a recovery hash
      // This handles the case where the hash is processed after our initial getSession check
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session && !settled) {
          settled = true
          setReady(true)
          window.history.replaceState(null, '', window.location.pathname)
        }
      })

      // ── Strategy 3: Manual hash parsing (fallback) ──
      // In case the auto-processing didn't fire the event yet
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type         = params.get('type')

      if (type === 'recovery' && accessToken && refreshToken && !settled) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error: sessionError }) => {
          if (!settled) {
            if (sessionError) {
              settled = true
              setError('Enlace inválido o expirado.')
            } else {
              settled = true
              setReady(true)
              window.history.replaceState(null, '', window.location.pathname)
            }
          }
        }).catch(() => {
          if (!settled) {
            settled = true
            setError('Enlace inválido o expirado.')
          }
        })
      }

      // ── Timeout: if nothing worked after 8 seconds ──
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true
          setError('Enlace inválido o expirado.')
        }
      }, 8000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    }

    checkSession()
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
