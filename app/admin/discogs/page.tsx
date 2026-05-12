'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SyncJob {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  items_processed: number
  items_total: number
  error: string | null
}

export default function DiscogsPage() {
  const [syncing, setSyncing]       = useState(false)
  const [lastSync, setLastSync]     = useState<SyncJob | null>(null)
  const [msg, setMsg]               = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)

  // Credencials
  const [username, setUsername]     = useState('')
  const [token, setToken]           = useState('')
  const [savingCreds, setSavingCreds] = useState(false)
  const [credsMsg, setCredsMsg]     = useState<string | null>(null)
  const [credsError, setCredsError] = useState<string | null>(null)

  useEffect(() => {
    fetchLastSync()
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'same-origin' })
      if (res.ok) {
        const data: { key: string; value: any }[] = await res.json()
        const usernameRow = data.find(s => s.key === 'discogs_username')
        const tokenRow    = data.find(s => s.key === 'discogs_token')
        if (usernameRow) setUsername(usernameRow.value ?? '')
        if (tokenRow)    setToken(tokenRow.value ?? '')
      }
    } catch {}
  }

  const saveCredentials = async () => {
    setSavingCreds(true); setCredsMsg(null); setCredsError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          settings: [
            { key: 'discogs_username', value: username.trim() },
            { key: 'discogs_token',    value: token.trim() },
          ],
        }),
      })
      if (res.ok) {
        setCredsMsg('Credencials guardades correctament')
      } else {
        const data = await res.json()
        setCredsError(data.error || 'Error al guardar')
      }
    } catch {
      setCredsError('Error de connexió')
    }
    setSavingCreds(false)
  }

  const fetchLastSync = async () => {
    try {
      const res = await fetch('/api/admin/sync', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setLastSync(data.lastJob || null)
      }
    } catch {}
    setLoading(false)
  }

  const handleSync = async () => {
    if (!username) {
      setError('Cal configurar el nom d\'usuari Discogs abans de sincronitzar')
      return
    }
    setSyncing(true); setError(null); setMsg(null)
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST', credentials: 'same-origin' })
      const data = await res.json()
      if (res.ok) {
        setMsg(`Sincronització completada: ${data.synced ?? 0} discos importats`)
        fetchLastSync()
      } else {
        setError(data.error || 'Error al sincronitzar')
      }
    } catch {
      setError('Error de connexió')
    }
    setSyncing(false)
  }

  const statusColor = (s: string) =>
    s === 'completed' ? '#22c55e' : s === 'running' ? '#f59e0b' : '#ef4444'
  const statusLabel = (s: string) =>
    s === 'completed' ? 'Completada' : s === 'running' ? 'En curs' : 'Error'

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← TORNAR</Link>
        <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>DISCOGS</h1>
        <div />
      </div>

      {msg && (
        <div className="mb-4 p-3" style={{ border: '1px solid #22c55e', backgroundColor: '#f0fdf4' }}>
          <p className="text-xs" style={{ color: '#22c55e' }}>{msg}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {/* Credencials */}
      <div className="mb-8 p-6" style={{ border: '1px solid #d1d5db' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: '#000000' }}>COMPTE DISCOGS</h2>

        {credsMsg && (
          <div className="mb-3 p-2" style={{ border: '1px solid #22c55e', backgroundColor: '#f0fdf4' }}>
            <p className="text-xs" style={{ color: '#22c55e' }}>{credsMsg}</p>
          </div>
        )}
        {credsError && (
          <div className="mb-3 p-2" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
            <p className="text-xs" style={{ color: '#ef4444' }}>{credsError}</p>
          </div>
        )}

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
              NOM D'USUARI DISCOGS
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="ex: rhythmcontrolshop"
              className="w-full text-sm px-3 py-2 focus:outline-none font-mono"
              style={{ border: '1px solid #d1d5db', color: '#000000' }}
            />
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              El compte Discogs d'on s'importa l'inventari «For Sale»
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
              PERSONAL ACCESS TOKEN <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••••••••••"
              className="w-full text-sm px-3 py-2 focus:outline-none font-mono"
              style={{ border: '1px solid #d1d5db', color: '#000000' }}
            />
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              Genera'l a{' '}
              <a href="https://www.discogs.com/settings/developers" target="_blank" rel="noopener noreferrer"
                className="underline" style={{ color: '#3b82f6' }}>
                discogs.com/settings/developers
              </a>
            </p>
          </div>
        </div>

        <button onClick={saveCredentials} disabled={savingCreds}
          className="text-xs px-6 py-2 transition-colors disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
          {savingCreds ? 'GUARDANT...' : 'GUARDAR COMPTE'}
        </button>
      </div>

      {/* Sincronització */}
      <div className="mb-8 p-6" style={{ border: '1px solid #d1d5db' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: '#000000' }}>SINCRONITZACIÓ</h2>
        {loading ? (
          <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>Carregant...</p>
        ) : lastSync ? (
          <div className="space-y-2 mb-4">
            <p className="text-xs" style={{ color: '#6b7280' }}>
              Última sincronització: {new Date(lastSync.started_at).toLocaleString('ca-ES')}
            </p>
            <p className="text-xs" style={{ color: statusColor(lastSync.status) }}>
              Estat: {statusLabel(lastSync.status)}
            </p>
            {lastSync.items_processed > 0 && (
              <p className="text-xs" style={{ color: '#000000' }}>
                Processats: {lastSync.items_processed}{lastSync.items_total > 0 ? ` / ${lastSync.items_total}` : ''}
              </p>
            )}
            {lastSync.error && (
              <p className="text-xs" style={{ color: '#ef4444' }}>Error: {lastSync.error}</p>
            )}
          </div>
        ) : (
          <p className="text-xs mb-4" style={{ color: '#6b7280' }}>Cap sincronització registrada.</p>
        )}

        <button onClick={handleSync} disabled={syncing || !username}
          className="text-xs px-6 py-2 transition-colors disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
          {syncing ? 'SINCRONITZANT...' : 'SINCRONITZAR ARA'}
        </button>
        {!username && (
          <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>
            Cal configurar el nom d'usuari abans de sincronitzar.
          </p>
        )}
        {username && !token && (
          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
            Sense token: límit de 25 req/min (suficient per inventaris normals).
          </p>
        )}
      </div>

      {/* Ajuda */}
      <div className="p-6" style={{ border: '1px solid #e5e7eb' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#000000' }}>COM FUNCIONA</h3>
        <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
          La sincronització importa tots els discos marcats com «For Sale» al compte Discogs indicat
          i els afegeix a l'inventari actiu. Els discos que ja no estiguin a Discogs es marquen automàticament com a venuts.
        </p>
      </div>
    </div>
  )
}
