// components/store/RecordGrid.tsx
// Grid responsivo: 2 cols (móvil) → 3 (tablet) → 6 (desktop).
// Columnas controladas por --rc-grid-cols definido en variables.css.

import RecordCard   from './RecordCard'
import type { Release }      from '@/types'
import type { PlayerTrack }  from '@/types'

interface RecordGridProps {
  releases:  Release[]
  loading:   boolean
  onSelect:  (release: Release)     => void
  onPlay:    (track: PlayerTrack)   => void
}

export default function RecordGrid({ releases, loading, onSelect, onPlay }: RecordGridProps) {
  if (loading) {
    return (
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(var(--rc-grid-cols), 1fr)' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              aspectRatio:  '1',
              backgroundColor: '#111',
              borderRight:  'var(--rc-border-card)',
              borderBottom: 'var(--rc-border-card)',
            }}
          />
        ))}
      </div>
    )
  }

  if (!releases.length) {
    return (
      <div
        className="flex items-center justify-center py-24"
        style={{ borderTop: 'var(--rc-border-card)' }}
      >
        <p className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
          Sin resultados para esta selección
        </p>
      </div>
    )
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(var(--rc-grid-cols), 1fr)',
        borderTop:  'var(--rc-border-main)',
        borderLeft: 'var(--rc-border-card)',
      }}
    >
      {releases.map(release => (
        <RecordCard
          key={release.id}
          release={release}
          onSelect={onSelect}
          onPlay={onPlay}
        />
      ))}
    </div>
  )
}
