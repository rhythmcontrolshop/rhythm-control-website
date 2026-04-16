'use client'
// components/admin/SyncStatus.tsx
// Muestra el estado del último sync y permite lanzar uno manualmente.
// Tema admin B/N: blanco sobre negro invertido.

import { useState }   from 'react'
import { format }     from 'date-fns'
import { es }         from 'date-fns/locale'
import type { SyncJob } from '@/types'

interface SyncStatusProps {
  lastJob: SyncJob | null
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completado',
  running:   'En progreso',
  failed:    'Fallido',
  pending:   'Pendiente',
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#000000',
  running:   '#374151',
  failed:    '#ef4444',
  pending:   '#6b7280',
}

export default function SyncStatus({ lastJob }: SyncStatusProps) {
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    setSyncError(null)

    const res  = await fetch('/api/admin/sync', { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setResult(
        `Sincronizados: ${data.synced} discos · Vendidos: ${data.markedSold}`
      )
    } else {
      setSyncError(data.error ?? 'Error durante la sincronización')
    }

    setLoading(false)
  }

  return (
    <div style={{ border: '1px solid #d1d5db' }}>

      {/* Última sincronización */}
      <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
        {lastJob ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6b7280' }}>
                ÚLTIMO SYNC
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: STATUS_COLORS[lastJob.status] ?? '#6b7280' }}
              >
                {STATUS_LABELS[lastJob.status] ?? lastJob.status}
              </span>
            </div>

            <div className="flex gap-6">
              <InfoItem
                label="Fecha"
                value={format(new Date(lastJob.started_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
              />
              <InfoItem
                label="Procesados"
                value={`${lastJob.items_processed} / ${lastJob.items_total}`}
              />
            </div>

            {lastJob.error && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{lastJob.error}</p>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Sin sincronizaciones previas
          </p>
        )}
      </div>

      {/* Botón de sync manual */}
      <div className="p-5 flex flex-col gap-3">
        <button
          onClick={handleSync}
          disabled={loading}
          className="text-sm py-3 transition-colors disabled:opacity-40"
          style={{
            backgroundColor: loading ? '#FFFFFF' : '#000000',
            color:           loading ? '#000000' : '#FFFFFF',
            border:          loading ? '1px solid #d1d5db' : 'none',
          }}
        >
          {loading ? 'SINCRONIZANDO...' : 'SINCRONIZAR AHORA'}
        </button>

        {loading && (
          <p className="text-xs text-center animate-pulse" style={{ color: '#6b7280' }}>
            Esto puede tardar varios minutos según el tamaño del inventario
          </p>
        )}
        {result && (
          <p className="text-xs text-center" style={{ color: '#000000' }}>
            {result}
          </p>
        )}
        {syncError && (
          <p className="text-xs text-center" style={{ color: '#ef4444' }}>{syncError}</p>
        )}
      </div>

    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: '#6b7280' }}>
        {label.toUpperCase()}
      </p>
      <p className="text-sm" style={{ color: '#000000' }}>
        {value}
      </p>
    </div>
  )
}
