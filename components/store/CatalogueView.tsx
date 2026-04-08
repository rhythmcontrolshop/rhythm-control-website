'use client'
// components/store/CatalogueView.tsx
// Orquestador del catálogo: tabs, grid, modal y player.

import { useState, useCallback } from 'react'
import CatalogueTabs  from './CatalogueTabs'
import RecordGrid     from './RecordGrid'
import RecordModal    from './RecordModal'
import FloatingPlayer from './FloatingPlayer'
import type { Release, PlayerTrack, PaginatedResponse } from '@/types'

interface CatalogueViewProps {
  initialReleases: Release[]
  initialTotal:    number
  genres:          string[]
}

export default function CatalogueView({ initialReleases, initialTotal, genres }: CatalogueViewProps) {
  const [releases, setReleases] = useState<Release[]>(initialReleases)
  const [total,    setTotal]    = useState(initialTotal)
  const [loading,  setLoading]  = useState(false)
  const [genre,    setGenre]    = useState<string | null>(null)
  const [page,     setPage]     = useState(1)
  const [selected, setSelected] = useState<Release | null>(null)
  const [openTab,  setOpenTab]  = useState<'tracklist' | 'notes' | 'artist' | 'label' | undefined>(undefined)
  const [track,    setTrack]    = useState<PlayerTrack | null>(null)
  const [clipIndex, setClipIndex] = useState(1)

  const perPage = 24

  const fetchReleases = useCallback(async (activeGenre: string | null, activePage: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(activePage) })
      if (activeGenre) params.set('genre', activeGenre)

      const res  = await fetch(`/api/catalogue?${params}`)
      const json = (await res.json()) as PaginatedResponse<Release>

      setReleases(json.data)
      setTotal(json.total)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  const handleGenreChange = (newGenre: string | null) => {
    setGenre(newGenre)
    setPage(1)
    fetchReleases(newGenre, 1)
  }

  const handlePageNext = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReleases(genre, nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePagePrev = () => {
    const prevPage = page - 1
    setPage(prevPage)
    fetchReleases(genre, prevPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlay = (newTrack: PlayerTrack, clip: number) => {
    setTrack(newTrack)
    setClipIndex(clip)
  }

  const handleSelectRelease = (release: Release, openInTab?: 'tracklist' | 'notes' | 'artist' | 'label') => {
    setSelected(release)
    setOpenTab(openInTab)
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <>
      <CatalogueTabs genres={genres} active={genre} onChange={handleGenreChange} />

      <RecordGrid
        releases={releases}
        loading={loading}
        onSelect={(r) => handleSelectRelease(r)}
        onPlay={handlePlay}
      />

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #1C1C1C' }}>
          <button
            className="font-display text-xs transition-opacity disabled:opacity-30 hover:opacity-60"
            style={{ color: '#FFFFFF' }}
            onClick={handlePagePrev}
            disabled={page <= 1}
          >
            ← ANTERIOR
          </button>
          <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
            {page} / {totalPages}
          </span>
          <button
            className="font-display text-xs transition-opacity disabled:opacity-30 hover:opacity-60"
            style={{ color: '#FFFFFF' }}
            onClick={handlePageNext}
            disabled={page >= totalPages}
          >
            SIGUIENTE →
          </button>
        </div>
      )}

      {selected && (
        <RecordModal
          release={selected}
          releases={releases}
          onClose={() => setSelected(null)}
          onPlay={handlePlay}
          onSelect={(r) => handleSelectRelease(r)}
          openTab={openTab}
        />
      )}

      {track && (
        <FloatingPlayer
          track={track}
          clipIndex={clipIndex}
          onClose={() => setTrack(null)}
        />
      )}
    </>
  )
}
