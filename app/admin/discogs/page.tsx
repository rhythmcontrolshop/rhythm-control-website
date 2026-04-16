'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SyncJob {
  id: string
  status: string
  started_at: string
  finished_at: string | null
  records_processed: number
  error_message: string | null
}

export default function DiscogsPage() {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<SyncJob | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLastSync() }, [])

  const fetchLastSync = async () => {
    try {
      const res = await fetch('/api/admin/sync')
      if (res.ok) {
        const data = await res.json()
        setLastSync(data.lastJob || data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMsg('Sincronización iniciada')
        fetchLastSync()
      } else {
        setError(data.error || 'Error al iniciar sincronización')
      }
    } catch {
      setError('Error de conexión')
    }
    setSyncing(false)
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
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

      <div className="mb-8 p-6" style={{ border: '1px solid #d1d5db' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>SINCRONIZACIÓN</h2>
        {loading ? (
          <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>Cargando...</p>
        ) : lastSync ? (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: '#6b7280' }}>
              Última sincronización: {new Date(lastSync.started_at).toLocaleString('es-ES')}
            </p>
            <p className="text-xs" style={{ color: lastSync.status === 'completed' ? '#22c55e' : lastSync.status === 'running' ? '#f59e0b' : '#ef4444' }}>
              Estado: {lastSync.status === 'completed' ? 'Completada' : lastSync.status === 'running' ? 'En progreso' : 'Error'}
            </p>
            {lastSync.records_processed > 0 && (
              <p className="text-xs" style={{ color: '#000000' }}>Registros procesados: {lastSync.records_processed}</p>
            )}
            {lastSync.error_message && (
              <p className="text-xs" style={{ color: '#ef4444' }}>Error: {lastSync.error_message}</p>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#6b7280' }}>No hay registros de sincronización.</p>
        )}
        <button onClick={handleSync} disabled={syncing}
          className="mt-4 text-xs px-6 py-2 transition-colors disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
          {syncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR AHORA'}
        </button>
      </div>

      <div className="p-6" style={{ border: '1px solid #e5e7eb' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#000000' }}>CÓMO FUNCIONA</h3>
        <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
          La sincronización con Discogs importa los discos disponibles en tu cuenta de Discogs
          y los añade al inventario de Rhythm Control. Los discos nuevos se marcan como activos
          y los que ya no están disponibles se actualizan automáticamente.
        </p>
      </div>
    </div>
  )
}
