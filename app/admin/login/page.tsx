'use client'
// app/admin/login/page.tsx

import { useState, type FormEvent } from 'react'
import { useRouter }                from 'next/navigation'

export default function AdminLogin() {
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Leer del FormData — funciona con autofill y gestores de contraseñas
    const formData = new FormData(e.currentTarget)
    const secret   = (formData.get('secret') as string ?? '').trim()

    const res = await fetch('/api/admin/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ secret }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error de autenticación')
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--rc-color-bg)' }}
    >
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl" style={{ color: 'var(--rc-color-text)' }}>
            RHYTHM CONTROL
          </h1>
          <p className="font-meta text-xs mt-2" style={{ color: 'var(--rc-color-muted)' }}>
            PANEL DE ADMINISTRACIÓN
          </p>
        </div>

        <hr className="separator mb-8" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="secret"
              className="font-meta text-xs block mb-2"
              style={{ color: 'var(--rc-color-muted)' }}
            >
              CONTRASEÑA
            </label>
            <input
              id="secret"
              name="secret"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
              style={{
                border:        'var(--rc-border-main)',
                color:         'var(--rc-color-text)',
                letterSpacing: 'var(--rc-tracking-mono)',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-meta text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-display text-sm py-3 transition-colors disabled:opacity-40"
            style={{
              backgroundColor: loading ? 'transparent' : 'var(--rc-color-text)',
              color:           loading ? 'var(--rc-color-text)' : 'var(--rc-color-bg)',
              border:          loading ? 'var(--rc-border-main)' : 'none',
            }}
          >
            {loading ? 'ACCEDIENDO...' : 'ACCEDER'}
          </button>
        </form>
      </div>
    </main>
  )
}
