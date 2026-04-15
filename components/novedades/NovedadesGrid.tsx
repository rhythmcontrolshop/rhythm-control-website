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

  const items = [...releases]
  while (items.length < 16) items.push(null as unknown as Release)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] bg-black">
        {items.map((release, i) => (
          release ? (
            <RecordCard 
              key={release.id} 
              release={release} 
              onSelect={setSelected} 
              onPlay={handlePlay}
              theme="magenta" 
              isNew
            />
          ) : (
            <div 
              key={`placeholder-${i}`} 
              className="relative aspect-square border-2 border-black flex items-center justify-center"
              style={{ backgroundColor: '#FF00FF' }}
            >
              <span className="font-display text-xs text-black opacity-30">PRÓXIMAMENTE</span>
            </div>
          )
        ))}
      </div>

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
