import RecordCard   from './RecordCard'
import type { Release, PlayerTrack } from '@/types'

interface RecordGridProps {
  releases:  Release[]
  loading:   boolean
  onSelect:  (release: Release) => void
  onPlay:    (track: PlayerTrack, clipIndex: number) => void
  isNew?: boolean
}

export default function RecordGrid({ releases, loading, onSelect, onPlay, isNew = false }: RecordGridProps) {
  // E3-5: Mobile-first grid: 2 cols base → 3 cols sm → 4 cols md → 6 cols lg
  // E3-6: Added sm: (640px) breakpoint
  // No more placeholder padding — just show real items
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[2px] bg-white">
      {releases.map((release) => (
        <RecordCard key={release.id} release={release} onSelect={onSelect} onPlay={onPlay} isNew={isNew} />
      ))}
      {loading && releases.length === 0 && (
        Array.from({ length: 12 }).map((_, i) => (
          <div key={`skeleton-${i}`} style={{ aspectRatio: '1', backgroundColor: '#111' }} />
        ))
      )}
    </div>
  )
}
