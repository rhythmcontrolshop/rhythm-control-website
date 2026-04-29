'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SyncJob {
  id: string
  status: string
  started_at: string
  finished_at: string | null
  records_processed: number
  items_total: number | null
  error_message: string | null
}

export default function DiscogsPage() {
  const [syncing, setSyncing] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [lastSync, setLastSync] = useState<SyncJob | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSql, setShowSql] = useState(false)

  useEffect(() => { fetchLastSync() }, [])

  const fetchLastSync = async () => {
    try {
      const res = await fetch('/api/admin/sync', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setLastSync(data.lastJob || data)
      }
    } catch (err) {
      console.warn('Sync GET error:', err)
    }
    setLoading(false)
  }

  const handleSync = async () => {
    if (!confirm(
      'ATENCION: La sincronizacion importara todo el inventario de tu cuenta de Discogs.\n\n' +
      'Si tienes releases congelados (IDs >= 9000), NO se veran afectados.\n\n' +
      'Los releases con IDs reales de Discogs que ya NO esten en tu cuenta\n' +
      'seran marcados como "sold" automaticamente.\n\n' +
      'Continuar?'
    )) return

    setSyncing(true)
    setError(null)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST', credentials: 'same-origin' })
      const data = await res.json()
      if (res.ok) {
        setMsg('Sincronizacion iniciada')
        fetchLastSync()
      } else {
        setError(data.error || 'Error al iniciar sincronizacion')
      }
    } catch {
      setError('Error de conexion')
    }
    setSyncing(false)
  }

  const handleEnrich = async () => {
    setEnriching(true)
    setError(null)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/enrich', { method: 'POST', credentials: 'same-origin' })
      const data = await res.json()
      if (res.ok) {
        setMsg(`Enriquecimiento completado: ${data.processed ?? 0} procesados, ${data.updated ?? 0} actualizados`)
      } else {
        setError(data.error || 'Error al enriquecer')
      }
    } catch {
      setError('Error de conexion')
    }
    setEnriching(false)
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

      {/* ── WARNING: Sync peligroso ────────────────────────────── */}
      <div className="mb-8 p-6" style={{ border: '2px solid #ef4444', backgroundColor: '#fef2f2' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#ef4444' }}>PRECAUCION</h3>
        <p className="text-xs leading-relaxed mb-2" style={{ color: '#991b1b' }}>
          <strong>NO ejecutes "SINCRONIZAR AHORA" si tienes releases reales conectados a tu cuenta de Discogs.</strong>
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
          El sync compara tu BD contra el inventario de Discogs. Si tu cuenta tiene menos listings que tu BD,
          los releases que falten se marcaran como <strong>sold</strong>. Esto puede eliminar discos del catalogo visible.
        </p>
      </div>

      {/* ── Sync status ────────────────────────────────────────── */}
      <div className="mb-8 p-6" style={{ border: '1px solid #d1d5db' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>SINCRONIZACION</h2>
        {loading ? (
          <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>Cargando...</p>
        ) : lastSync ? (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: '#6b7280' }}>
              Ultima sincronizacion: {new Date(lastSync.started_at).toLocaleString('es-ES')}
            </p>
            <p className="text-xs" style={{ color: lastSync.status === 'completed' ? '#22c55e' : lastSync.status === 'running' ? '#f59e0b' : '#ef4444' }}>
              Estado: {lastSync.status === 'completed' ? 'Completada' : lastSync.status === 'running' ? 'En progreso' : 'Error'}
            </p>
            {lastSync.items_total && (
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Items totales: {lastSync.items_total} | Procesados: {lastSync.records_processed}
              </p>
            )}
            {lastSync.error_message && (
              <p className="text-xs" style={{ color: '#ef4444' }}>Error: {lastSync.error_message}</p>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#6b7280' }}>No hay registros de sincronizacion.</p>
        )}
        <button onClick={handleSync} disabled={syncing}
          className="mt-4 text-xs px-6 py-2 transition-colors disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
          {syncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR AHORA'}
        </button>
      </div>

      {/* ── Enrich ─────────────────────────────────────────────── */}
      <div className="mb-8 p-6" style={{ border: '1px solid #d1d5db' }}>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#000000' }}>ENRIQUECER DATOS</h2>
        <p className="text-xs leading-relaxed mb-1" style={{ color: '#6b7280' }}>
          Completa tracklist, notas, contraportada y perfil de artista para releases que todavia no lo tienen.
          Lee de la API de Discogs y actualiza tu BD. <strong>No afecta al inventario.</strong>
        </p>
        <p className="text-xs leading-relaxed mb-4" style={{ color: '#9ca3af' }}>
          Procesa hasta 50 releases por ejecucion. Repetir si es necesario. ~2 segundos por release.
        </p>
        <button onClick={handleEnrich} disabled={enriching}
          className="text-xs px-6 py-2 transition-colors disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
          {enriching ? 'ENRIQUECIENDO...' : 'ENRIQUECER AHORA'}
        </button>
      </div>

      {/* ── Instrucciones freeze ────────────────────────────────── */}
      <div className="mb-8 p-6" style={{ border: '2px solid #f59e0b', backgroundColor: '#fffbeb' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#92400e' }}>PROTEGER COLECCION (DEMO)</h2>
        <p className="text-xs leading-relaxed mb-4" style={{ color: '#78350f' }}>
          Para hacer demos sin riesgo de afectar la coleccion real de Discogs del cliente,
          puedes "congelar" las primeras 200 releases como datos locales. Despues del freeze,
          el sync de Discogs no las tocara.
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>1</span>
            <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
              <strong>Backup:</strong> Exporta la tabla <code>releases</code> a CSV desde Supabase Dashboard → Table Editor → Releases → Export
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>2</span>
            <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
              <strong>Enriquecer (opcional):</strong> Pulsa "ENRIQUECER AHORA" varias veces hasta que los releases tengan tracklist completo
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>3</span>
            <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
              <strong>Congelar:</strong> Abre Supabase SQL Editor y ejecuta el script <code>manual_freeze_sample_releases.sql</code> (en <code>supabase/migrations/</code>)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>4</span>
            <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
              <strong>Verificar:</strong> Ejecuta <code>SELECT count(*), min(discogs_listing_id), max(discogs_listing_id) FROM releases WHERE status = 'active';</code> — deberias ver los nuevos IDs >= 9000
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>5</span>
            <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
              <strong>Listo:</strong> A partir de ahora el sync de Discogs es seguro — no encontrara estos listings y no los marcara como sold
            </p>
          </div>
        </div>

        <button onClick={() => setShowSql(!showSql)}
          className="text-xs px-4 py-2 transition-colors hover:opacity-80"
          style={{ border: '1px solid #92400e', color: '#92400e', backgroundColor: 'transparent', cursor: 'pointer' }}>
          {showSql ? 'OCULTAR SCRIPT SQL' : 'VER SCRIPT SQL'}
        </button>

        {showSql && (
          <pre className="mt-3 p-4 text-xs overflow-x-auto" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', borderRadius: '4px', maxHeight: '400px', overflowY: 'auto' }}>
{`-- freeze_sample_releases.sql
-- Congela 200 releases activas como datos locales de demo
-- Reasigna discogs_listing_id al rango 9000+
-- El sync de Discogs ya no las tocara

BEGIN;

-- Encontrar el max ID en rango mock
SELECT COALESCE(MAX(discogs_listing_id), 8999)
  INTO _max_mock_id
FROM releases
WHERE discogs_listing_id >= 9000;

-- Crear temp table con 200 releases a congelar
CREATE TEMP TABLE _to_freeze AS
SELECT id, discogs_listing_id AS old_listing_id,
       discogs_release_id
FROM releases
WHERE status = 'active'
  AND discogs_listing_id < 9000
ORDER BY created_at ASC
LIMIT 200;

-- Reasignar IDs al rango mock
UPDATE releases r
SET discogs_listing_id = f.new_listing_id
FROM (
  SELECT id,
    (_max_mock_id + ROW_NUMBER()
     OVER (ORDER BY old_listing_id))::bigint
    AS new_listing_id
  FROM _to_freeze
) f
WHERE r.id = f.id;

DROP TABLE _to_freeze;
COMMIT;`}
          </pre>
        )}
      </div>

      {/* ── Info ────────────────────────────────────────────────── */}
      <div className="p-6" style={{ border: '1px solid #e5e7eb' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#000000' }}>COMO FUNCIONA</h3>
        <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
          La sincronizacion con Discogs importa los discos disponibles en tu cuenta de Discogs
          y los anade al inventario de Rhythm Control. Los discos nuevos se marcan como activos
          y los que ya no estan disponibles se actualizan automaticamente.
        </p>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: '#6b7280' }}>
          El token y usuario de Discogs se configuran en <Link href="/admin/ajustes" className="underline">Ajustes</Link>.
          Tambien puedes usar las variables de entorno DISCOGS_TOKEN y DISCOGS_USERNAME en Vercel.
        </p>
      </div>
    </div>
  )
}
