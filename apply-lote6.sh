#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# apply-lote6.sh — Self-contained patch for LOTE 6
# 7 files: AdminShell, layout, events redirect, discogs page,
#          inventory inline qty, InventoryActions (no UDS btn)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

REPO="${1:-.}"

if [ ! -d "$REPO" ]; then
  echo "ERROR: Directory '$REPO' does not exist."
  exit 1
fi

echo "═══════════════════════════════════════════════════"
echo " LOTE 6 — Applying 7 files to: $REPO"
echo "═══════════════════════════════════════════════════"
echo ""

COUNT=0
TOTAL=7

# ────────────────────────────────────────────────────
# 1/7  components/admin/AdminShell.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/components/admin"
cat << 'LOTE6EOF' > "$REPO/components/admin/AdminShell.tsx"
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'

const NO_NAV_PATHS = ['/admin/login', '/admin/recover', '/admin/reset-password']

const NAV_LINKS = [
  { href: '/admin',              label: 'Dashboard'  },
  { href: '/admin/inventory',    label: 'Inventario' },
  { href: '/admin/pricing',      label: 'Precios'    },
  { href: '/admin/shipping',     label: 'Envíos'     },
  { href: '/admin/reservations', label: 'Guardi'     },
  { href: '/admin/scan',         label: 'Escanear'   },
  { href: '/admin/barcodes',     label: 'Códigos'    },
  { href: '/admin/events',       label: 'Agenda'     },
  { href: '/admin/orders',       label: 'Pedidos'    },
  { href: '/admin/clientes',     label: 'Clientes'   },
  { href: '/admin/discogs',      label: 'Discogs'    },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = !NO_NAV_PATHS.some(p => pathname.startsWith(p))

  return (
    <>
      {showNav && (
        <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-6"
          style={{
            height: '56px',
            borderBottom: '1px solid #d4d4d4',
            backgroundColor: '#FFFFFF',
            zIndex: 100,
          }}>
          <Link href="/" className="flex items-center group relative" style={{ textDecoration: 'none', height: '40px', overflow: 'visible' }}>
            <span className="transition-opacity duration-200 group-hover:opacity-0" style={{ color: '#000000', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: '900', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
              RHYTHM CONTROL
            </span>
            <span className="transition-opacity duration-200 group-hover:opacity-0" style={{ color: '#6b7280', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: '400', fontSize: '0.75rem' }}>/ ADMIN</span>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
              style={{ color: '#000000', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: '900', fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: '1' }}>
              BARCELONA
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs transition-colors hover:text-black"
                style={{ color: '#6b7280', fontFamily: 'var(--rc-font-mono)', letterSpacing: '0.07em' }}>{label}</Link>
            ))}
          </div>
          <LogoutButton />
        </nav>
      )}
      <div style={{ paddingTop: showNav ? '56px' : '0' }}>{children}</div>
    </>
  )
}
LOTE6EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] components/admin/AdminShell.tsx"

# ────────────────────────────────────────────────────
# 2/7  app/admin/layout.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin"
cat << 'LOTE6EOF' > "$REPO/app/admin/layout.tsx"
import AdminShell from '@/components/admin/AdminShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin-theme style={{ minHeight: '100dvh', backgroundColor: '#FFFFFF' }}>
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
LOTE6EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/layout.tsx"

# ────────────────────────────────────────────────────
# 3/7  app/admin/events/page.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin/events"
cat << 'LOTE6EOF' > "$REPO/app/admin/events/page.tsx"
import { redirect } from 'next/navigation'

export default function EventsPage() {
  redirect('/admin/agenda')
}
LOTE6EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/events/page.tsx"

# ────────────────────────────────────────────────────
# 4/7  app/admin/discogs/page.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin/discogs"
cat << 'LOTE6EOF' > "$REPO/app/admin/discogs/page.tsx"
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
LOTE6EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/discogs/page.tsx"

# ────────────────────────────────────────────────────
# 5/7  app/admin/inventory/page.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin/inventory"
cat << 'LOTE6EOF' > "$REPO/app/admin/inventory/page.tsx"
'use client'

import { useState, useEffect } from 'react'
import InventoryActions from './InventoryActions'

const STATUS: Record<string, { label: string; color: string }> = {
  active:   { label: 'ACTIVO',    color: '#22c55e' },
  reserved: { label: 'RESERVADO', color: '#f59e0b' },
  sold:     { label: 'VENDIDO',   color: '#ef4444' },
  hidden:   { label: 'OCULTO',    color: '#6b7280' },
  gifted:   { label: 'REGALADO',  color: '#8b5cf6' },
}

interface ReleaseRow {
  id: string
  title: string
  artists: string[]
  condition: string
  price: number
  status: string
  thumb: string
  quantity: number
  barcode: string | null
  location: string | null
  discogs_listing_id: number
  format: string
  year: number | null
  weight_grams: number | null
}

type SortField = 'artist' | 'title' | 'price' | 'condition' | 'year' | 'status' | 'quantity' | 'format'
type SortDir = 'asc' | 'desc'

export default function InventoryPage() {
  const [releases, setReleases] = useState<ReleaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('artist')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [savingQty, setSavingQty] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/catalogue?limit=500')
      .then(r => r.json())
      .then(data => {
        setReleases(data.data ?? data ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function updateQuantity(releaseId: string, newQty: number) {
    setSavingQty(releaseId)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty }),
    })
    setReleases(prev => prev.map(r => r.id === releaseId ? { ...r, quantity: newQty } : r))
    setSavingQty(null)
  }

  const filtered = filter === 'all' ? releases :
    filter === 'active' ? releases.filter(r => r.status === 'active') :
    filter === 'sold' ? releases.filter(r => r.status === 'sold') :
    filter === 'reserved' ? releases.filter(r => r.status === 'reserved') :
    releases

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'artist': cmp = (a.artists?.[0] ?? '').localeCompare(b.artists?.[0] ?? ''); break
      case 'title': cmp = a.title.localeCompare(b.title); break
      case 'price': cmp = a.price - b.price; break
      case 'condition': cmp = (a.condition ?? '').localeCompare(b.condition ?? ''); break
      case 'year': cmp = (a.year ?? 0) - (b.year ?? 0); break
      case 'status': cmp = (a.status ?? '').localeCompare(b.status ?? ''); break
      case 'quantity': cmp = (a.quantity ?? 1) - (b.quantity ?? 1); break
      case 'format': cmp = (a.format ?? '').localeCompare(b.format ?? ''); break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const total = releases.length
  const active = releases.filter(r => r.status === 'active').length
  const withBarcode = releases.filter(r => r.barcode).length
  const totalUnits = releases.reduce((sum, r) => sum + (r.quantity || 1), 0)

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const isActive = sortField === field
    return (
      <th className="text-xs font-medium px-3 py-3 cursor-pointer select-none"
        style={{ color: isActive ? '#000000' : '#6b7280' }}
        onClick={() => toggleSort(field)}>
        <span className="inline-flex items-center gap-1">
          {label}
          <span style={{ fontSize: '10px', opacity: isActive ? 1 : 0.3 }}>
            {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
          </span>
        </span>
      </th>
    )
  }

  if (loading) return <div className="p-6"><p className="text-sm" style={{ color: '#6b7280' }}>Cargando inventario...</p></div>

  return (
    <div className="p-6">
      {error && (
        <div className="p-4 mb-6" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
          <p className="text-sm" style={{ color: '#ef4444' }}>Error: {error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>INVENTARIO</h1>
        <div className="flex gap-4 text-xs" style={{ color: '#6b7280' }}>
          <span>{total} registros</span>
          <span style={{ color: '#22c55e' }}>{active} activos</span>
          <span>{totalUnits} unidades</span>
          <span>{withBarcode} con código de barras</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'TODOS' },
          { key: 'active', label: 'EN VENTA' },
          { key: 'sold', label: 'VENDIDOS' },
          { key: 'reserved', label: 'GUARDI' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="text-xs px-4 py-2 transition-colors duration-150"
            style={{
              backgroundColor: filter === f.key ? '#000000' : '#FFFFFF',
              color: filter === f.key ? '#FFFFFF' : '#374151',
              border: '1px solid ' + (filter === f.key ? '#000000' : '#d1d5db'),
              cursor: 'pointer',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '2px solid #000000' }}>
              <th className="text-xs font-medium px-3 py-3 w-12" style={{ color: '#6b7280' }}></th>
              <SortHeader field="artist" label="ARTISTA" />
              <SortHeader field="title" label="TÍTULO" />
              <SortHeader field="condition" label="COND." />
              <SortHeader field="format" label="FORMATO" />
              <SortHeader field="quantity" label="UDS." />
              <SortHeader field="price" label="PRECIO" />
              <th className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>BARCODE</th>
              <th className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>UBIC.</th>
              <SortHeader field="status" label="ESTADO" />
              <th className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => {
              const st = STATUS[r.status ?? 'active'] ?? STATUS.active
              return (
                <tr key={r.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="px-3 py-3 w-12">
                    {r.thumb
                      ? <img src={r.thumb} alt="" className="w-10 h-10 object-cover" style={{ border: '1px solid #d1d5db' }} />
                      : <div className="w-10 h-10" style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>{r.artists?.[0] ?? '—'}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#374151' }}>{r.title}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#000000' }}>{r.condition ?? '—'}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#374151' }}>{r.format ?? '—'}</td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      defaultValue={r.quantity ?? 1}
                      disabled={savingQty === r.id}
                      className="w-14 text-sm font-bold text-center focus:outline-none"
                      style={{
                        border: savingQty === r.id ? '1px solid #f59e0b' : '1px solid #d1d5db',
                        color: r.quantity > 1 ? '#000000' : '#9ca3af',
                        padding: '2px 4px',
                        backgroundColor: '#FFFFFF',
                      }}
                      onBlur={async (e) => {
                        const newQty = parseInt(e.target.value) || 0
                        if (newQty !== (r.quantity ?? 1)) {
                          await updateQuantity(r.id, newQty)
                        }
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur()
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                    {r.price?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    {r.barcode ? (
                      <span className="text-xs font-mono px-2 py-1"
                        style={{ backgroundColor: '#f3f4f6', color: '#000000', border: '1px solid #d1d5db' }}>
                        {r.barcode}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: r.location ? '#000000' : '#9ca3af' }}>
                    {r.location || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-1"
                      style={{
                        color: st.color,
                        border: `1px solid ${st.color}`,
                        backgroundColor: st.color + '10',
                      }}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <InventoryActions
                      releaseId={r.id}
                      currentStatus={r.status ?? 'active'}
                      barcode={r.barcode}
                      quantity={r.quantity ?? 1}
                      location={r.location}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-10 pt-8" style={{ borderTop: '2px solid #000000' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>PERFILES DE PESO / PRECIO</h2>
        <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
          Configura perfiles de peso para calcular automáticamente los costes de envío.
          Los perfiles se asocian al formato del disco.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { format: 'LP', weight: '180–230g', desc: 'Álbum estándar 12"' },
            { format: 'Doble LP', weight: '360–460g', desc: 'Álbum doble 12"' },
            { format: '7"', weight: '40–60g', desc: 'Sencillo 7 pulgadas' },
          ].map(profile => (
            <div key={profile.format} className="p-4" style={{ border: '1px solid #d1d5db' }}>
              <p className="text-sm font-bold" style={{ color: '#000000' }}>{profile.format}</p>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{profile.desc}</p>
              <p className="text-xs mt-2 font-mono" style={{ color: '#000000' }}>Peso: {profile.weight}</p>
              <a href="/admin/pricing" className="text-xs mt-2 inline-block" style={{ color: '#3b82f6' }}>
                Configurar precios →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
LOTE6EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/inventory/page.tsx"

# ────────────────────────────────────────────────────
# 6/7  app/admin/inventory/InventoryActions.tsx
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app/admin/inventory"
cat << 'LOTE6EOF' > "$REPO/app/admin/inventory/InventoryActions.tsx"
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InventoryActionsProps {
  releaseId: string
  currentStatus: string
  barcode: string | null
  quantity: number
  location: string | null
}

export default function InventoryActions({ releaseId, currentStatus, barcode, quantity, location }: InventoryActionsProps) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState<'barcode' | 'location' | null>(null)
  const [editValue, setEditValue] = useState('')
  const router = useRouter()

  async function updateStatus(status: string) {
    setLoading(true)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false); setConfirm(false); router.refresh()
  }

  async function updateField(field: string, value: string) {
    setLoading(true)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    setLoading(false); setEditing(null); router.refresh()
  }

  async function generateBarcode() {
    setLoading(true)
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generate_barcode: true }),
    })
    setLoading(false); router.refresh()
  }

  if (currentStatus === 'sold') return null

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Botón de barcode */}
      {!barcode && (
        <button onClick={generateBarcode} disabled={loading}
          className="text-xs px-2 py-1"
          style={{ border: '1px solid #d1d5db', color: '#374151', backgroundColor: '#f9fafb', cursor: 'pointer' }}>
          {loading ? '...' : '+BC'}
        </button>
      )}
      {barcode && (
        <button onClick={() => { setEditing('barcode'); setEditValue(barcode) }}
          className="text-xs px-2 py-1"
          style={{ border: '1px solid #d1d5db', color: '#374151', backgroundColor: '#f9fafb', cursor: 'pointer' }}>
          BC
        </button>
      )}

      {/* Botón de ubicación */}
      <button onClick={() => { setEditing('location'); setEditValue(location || '') }}
        className="text-xs px-2 py-1"
        style={{ border: '1px solid #d1d5db', color: '#374151', backgroundColor: '#f9fafb', cursor: 'pointer' }}>
        UBIC
      </button>

      {/* Acción de regalar */}
      {currentStatus === 'active' && (confirm ? (
        <>
          <button onClick={() => updateStatus('gifted')} disabled={loading}
            className="text-xs px-2 py-1"
            style={{ backgroundColor: '#8b5cf6', color: '#fff', cursor: 'pointer' }}>
            {loading ? '...' : '¿CONFIRMAR?'}
          </button>
          <button onClick={() => setConfirm(false)}
            className="text-xs" style={{ color: '#9ca3af' }}>×</button>
        </>
      ) : (
        <button onClick={() => setConfirm(true)}
          className="text-xs px-2 py-1"
          style={{ border: '1px solid #d1d5db', color: '#6b7280', cursor: 'pointer' }}>REGALAR</button>
      ))}

      {/* Modal de edición inline (barcode / ubicación) */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 500 }}
          onClick={e => { if (e.target === e.currentTarget) setEditing(null) }}>
          <div className="p-6 w-full max-w-xs" style={{ backgroundColor: '#FFFFFF', border: '2px solid #000' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#000000' }}>
              {editing === 'barcode' ? 'CÓDIGO DE BARRAS' : 'UBICACIÓN EN TIENDA'}
            </p>
            <input
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="w-full text-sm px-3 py-2 mb-4 focus:outline-none"
              style={{ border: '1px solid #d1d5db', color: '#000000' }}
              placeholder={editing === 'barcode' ? 'EAN-13 o código interno' : 'Ej: Estantería B, Caja 3'}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => updateField(editing, editValue)}
                disabled={loading}
                className="flex-1 text-sm py-2"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
                {loading ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
              <button onClick={() => setEditing(null)}
                className="text-sm py-2 px-4"
                style={{ border: '1px solid #d1d5db', color: '#374151', cursor: 'pointer' }}>
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
LOTE6EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/admin/inventory/InventoryActions.tsx"

# ────────────────────────────────────────────────────
# 7/7  app/page.tsx — STOCK sin hero, título grande centrado
# ────────────────────────────────────────────────────
mkdir -p "$REPO/app"
cat << 'LOTE6EOF' > "$REPO/app/page.tsx"
import Navigation    from '@/components/layout/Navigation'
import CatalogueView from '@/components/store/CatalogueView'
import StrobeDots    from '@/components/ui/StrobeDots'
import Footer        from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import type { Release } from '@/types'

async function getInitialData(): Promise<{ releases: Release[]; total: number; genres: string[] }> {
  try {
    const supabase = await createClient()
    const { data, error, count } = await supabase.from('releases').select('*', { count: 'exact' }).eq('status', 'active').order('created_at', { ascending: false }).limit(24)
    if (error) return { releases: [], total: 0, genres: [] }
    const genreSet = new Set<string>()
    ;(data ?? []).forEach(r => r.genres?.forEach((g: string) => genreSet.add(g)))
    return { releases: data ?? [], total: count ?? 0, genres: Array.from(genreSet).sort() }
  } catch { return { releases: [], total: 0, genres: [] } }
}

export default async function Home() {
  const { releases, total, genres } = await getInitialData()
  return (
    <>
      <Navigation />
      <main style={{ minHeight: '100vh', backgroundColor: '#000000' }}>
        {/* STOCK Title - centered, big, like Novedades */}
        <div className="flex items-center justify-center" style={{ borderTop: '2px solid #FFFFFF', borderBottom: '2px solid #FFFFFF', padding: '24px' }}>
          <h2 className="font-display text-center" style={{ color: '#FFFFFF', fontSize: 'clamp(3.5rem, 8.4vw, 7rem)', lineHeight: '1' }}>
            STOCK
          </h2>
        </div>
        <CatalogueView initialReleases={releases} initialTotal={total} genres={genres} />
        <div style={{ height: '48px' }} />
        <StrobeDots />
      </main>
      <Footer />
    </>
  )
}
LOTE6EOF
COUNT=$((COUNT + 1))
echo "  ✓ [$COUNT/$TOTAL] app/page.tsx"

# ────────────────────────────────────────────────────
# Done!
# ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo " LOTE 6 COMPLETE — $COUNT/$TOTAL files written"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Fixes applied:"
echo "  1. AdminShell — nav oculto en login/recover/reset-password"
echo "  2. app/page.tsx — STOCK sin hero, título grande centrado"
echo "  3. admin/events/page.tsx — redirect a /admin/agenda"
echo "  4. admin/discogs/page.tsx — nueva página + link en nav"
echo "  5. inventory/page.tsx — input cantidad inline (sin botón UDS)"
echo "  6. InventoryActions.tsx — botón UDS eliminado"
echo "  7. admin/layout.tsx — usa AdminShell con Discogs en nav"
