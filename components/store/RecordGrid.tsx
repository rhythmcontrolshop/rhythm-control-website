import RecordCard   from './RecordCard'
import type { Release, PlayerTrack } from '@/types'

interface RecordGridProps {
  releases:  Release[]
  loading:   boolean
  onSelect:  (release: Release) => void
  onPlay:    (track: PlayerTrack, clipIndex: number) => void
}

export default function RecordGrid({ releases, loading, onSelect, onPlay }: RecordGridProps) {
  // Simular 4 filas de 6 columnas (24 items) rellenando con placeholders
  const totalSlots = 24; 
  const items = [...releases];
  
  // Rellenar con placeholders (null) si faltan items
  while (items.length < totalSlots) {
    items.push(null as unknown as Release); // Trick para rellenar
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-[2px]" style={{ backgroundColor: '#FFFFFF' }}>
      {items.map((release, i) => (
        release ? (
          <RecordCard key={release.id} release={release} onSelect={onSelect} onPlay={onPlay} />
        ) : (
          // Placeholder para simular fila completa
          <div key={`placeholder-${i}`} style={{ aspectRatio: '1', backgroundColor: '#111' }} />
        )
      ))}
    </div>
  )
}
