'use client'
import { useState } from 'react'
import RecordCard from '@/components/store/RecordCard'
import RecordModal from '@/components/store/RecordModal'
import FloatingPlayer from '@/components/store/FloatingPlayer'
import type { Release, PlayerTrack } from '@/types'

interface NovedadesGridProps {
  releases: Release[]
}

export default function NovedadesGrid({ releases }: NovedadesGridProps) {
  const [selected, setSelected] = useState<Release | null>(null)
  const [track, setTrack] = useState<PlayerTrack | null>(null)
  const [clipIndex, setClipIndex] = useState(1)

  const handlePlay = (t: PlayerTrack, clip: number) => { setTrack(t); setClipIndex(clip) }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] bg-black">
        {releases.map((release) => (
          <RecordCard 
            key={release.id} 
            release={release} 
            onSelect={setSelected} 
            onPlay={handlePlay}
            theme="magenta"
            isNew={false}
          />
        ))}
      </div>

      {releases.length === 0 && (
        <div className="py-20 text-center">
          <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>No hay novedades en los últimos 30 días.</p>
        </div>
      )}

      {selected && (
        <RecordModal 
          release={selected} 
          releases={releases} 
          onClose={() => setSelected(null)} 
          onPlay={handlePlay} 
          onSelect={setSelected}
          theme="magenta"
        />
      )}
      {track && (
        <FloatingPlayer track={track} clipIndex={clipIndex} onClose={() => setTrack(null)} />
      )}
    </>
  )
}
