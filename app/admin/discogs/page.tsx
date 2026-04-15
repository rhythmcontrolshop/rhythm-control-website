'use client'
import { useState, useEffect } from 'react'

interface SyncJob {
  id: string; status: string; started_at: string; finished_at: string | null
  releases_fetched: number; releases_created: number; releases_updated: number
  error_message: string | null
}

export default function DiscogsPage() {
  const [jobs, setJobs]             = useState<SyncJob[]>([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [enriching, setEnriching]   = useState(false)
  const [msg, setMsg]               = useState<string | null>(null)

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    setLoading(true)
    const res = await fetch('/api/admin/sync')
    if (res.ok) {
      const data = await res.json()
      setJobs(data.jobs ?? data ?? [])
    }
    setLoading(false)
  }

  async function startSync() {
    setSyncing(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMsg(`Sync iniciado: ${data.message || 'procesando...'}`)
        // Poll for completion
        setTimeout(() => { fetchJobs(); setSyncing(false) }, 5000)
      } else {
        setMsg(`Error: ${data.error}`)
        setSyncing(false)
      }
    } catch {
      setMsg('Error de conexion'); setSyncing(false)
    }
  }

  async function startEnrich() {
    setEnriching(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/enrich', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMsg(`Enrich iniciado: ${data.message || 'procesando...'}`)
        setTimeout(() => { fetchJobs(); setEnriching(false) }, 5000)
      } else {
        setMsg(`Error: ${data.error}`)
        setEnriching(false)
      }
    } catch {
      setMsg('Error de conexion'); setEnriching(false)
    }
  }

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    running:  { label: 'EN CURSO',  color: '#3b82f6' },
    success:  { label: 'COMPLETADO', color: '#22c55e' },
    failed:   { label: 'ERROR',     color: '#ef4444' },
    pending:  { label: 'PENDIENTE', color: '#f59e0b' },
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>DISCOGS</h1>
        <span className="text-xs" style={{ color: '#6b7280' }}>Sincronizacion con tu inventario Discogs</span>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-5" style={{ border: '1px solid #d1d5db' }}>
          <p className="text-sm font-bold mb-2" style={{ color: '#000000' }}>SYNC INVENTARIO</p>
          <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
            Importa todos los listings de tu cuenta de Discogs. Crea releases nuevos y actualiza los existentes.
            Rate limit: 1.2s entre llamadas.
          </p>
          <button onClick={startSync} disabled={syncing}
            className="text-xs px-6 py-3 transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
            {syncing ? 'SINCRONIZANDO...' : 'SYNC AHORA'}
          </button>
        </div>
        <div className="p-5" style={{ border: '1px solid #d1d5db' }}>
          <p className="text-sm font-bold mb-2" style={{ color: '#000000' }}>ENRIQUECER DATOS</p>
          <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
            Completa datos faltantes: tracklist, contraportada, estilos, perfil de artista.
            Usa la API de Discogs para releases sin estilos.
          </p>
          <button onClick={startEnrich} disabled={enriching}
            className="text-xs px-6 py-3 transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
            {enriching ? 'ENRIQUECIENDO...' : 'ENRIQUECER'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 mb-6" style={{ border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}>
          <p className="text-xs" style={{ color: '#000000' }}>{msg}</p>
        </div>
      )}

      {/* Historial */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: '#6b7280' }}>HISTORIAL DE SYNC</p>
        {loading ? (
          <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>Cargando...</p>
        ) : jobs.length === 0 ? (
          <p className="text-xs" style={{ color: '#9ca3af' }}>Sin jobs de sincronizacion</p>
        ) : (
          <div className="overflow-x-auto" style={{ border: '1px solid #d1d5db' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  {['FECHA', 'ESTADO', 'IMPORTADOS', 'CREADOS', 'ACTUALIZADOS', 'DURACION', ''].map((h, i) => (
                    <th key={i} className="text-xs font-medium p-3" style={{ color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const st = STATUS_MAP[job.status] ?? STATUS_MAP.pending
                  const duration = job.finished_at && job.started_at
                    ? Math.round((new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()) / 1000)
                    : null
                  return (
                    <tr key={job.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="p-3 text-xs" style={{ color: '#000000' }}>
                        {new Date(job.started_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1" style={{ color: st.color, border: `1px solid ${st.color}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3 text-xs font-bold" style={{ color: '#000000' }}>{job.releases_fetched ?? 0}</td>
                      <td className="p-3 text-xs" style={{ color: '#22c55e' }}>{job.releases_created ?? 0}</td>
                      <td className="p-3 text-xs" style={{ color: '#3b82f6' }}>{job.releases_updated ?? 0}</td>
                      <td className="p-3 text-xs" style={{ color: '#6b7280' }}>
                        {duration !== null ? `${duration}s` : '—'}
                      </td>
                      <td className="p-3 text-xs" style={{ color: '#ef4444' }}>
                        {job.error_message?.slice(0, 50) || ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
