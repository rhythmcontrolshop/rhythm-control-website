'use client'
// E2-3: NovedadesGrid con paginación

import { useState } from 'react'
import RecordCard from '@/components/store/RecordCard'
import RecordModal from '@/components/store/RecordModal'
import FloatingPlayer from '@/components/store/FloatingPlayer'
import type { Release, PlayerTrack } from '@/types'

interface NovedadesGridProps {
  releases: Release[]
  total: number
  page: number
  perPage: number
}

export default function NovedadesGrid({ releases, total, page, perPage }: NovedadesGridProps) {
  const [selected, setSelected] = useState<Release | null>(null)
  const [track, setTrack] = useState<PlayerTrack | null>(null)
  const [clipIndex, setClipIndex] = useState(1)

  const handlePlay = (t: PlayerTrack, clip: number) => { setTrack(t); setClipIndex(clip) }

  const totalPages = Math.ceil(total / perPage)

  // Paginación usa URL search params — navegamos con window.location
  // para que el server component re-filtre con el nuevo offset
  const goToPage = (p: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(p))
    window.location.href = url.toString()
  }

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

      {totalPages > 1 && (
        <>
          <div style={{ height: '48px' }} />
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '2px solid #FFFFFF', borderBottom: '2px solid #FFFFFF' }}>
            <button
              className="font-display text-xs disabled:opacity-30 hover:opacity-60"
              style={{ color: '#FFFFFF' }}
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >← ANTERIOR</button>
            <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
              {page} / {totalPages}
            </span>
            <button
              className="font-display text-xs disabled:opacity-30 hover:opacity-60"
              style={{ color: '#FFFFFF' }}
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >SIGUIENTE →</button>
          </div>
        </>
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
