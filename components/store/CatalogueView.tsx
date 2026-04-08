'use client'
// components/store/CatalogueView.tsx
// Orquestador del catálogo: tabs de géneros, grid de discos, modal y player.
// Gestiona todo el estado del lado cliente.

import { useState, useEffect, useCallback } from 'react'
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
  const [releases, setReleases]         = useState<Release[]>(initialReleases)
  const [total,    setTotal]            = useState(initialTotal)
  const [loading,  setLoading]          = useState(false)
  const [genre,    setGenre]            = useState<string | null>(null)
  const [page,     setPage]             = useState(1)
  const [selected, setSelected]         = useState<Release | null>(null)
  const [track,    setTrack]            = useState<PlayerTrack | null>(null)

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
      // mantener datos anteriores en caso de error de red
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

  const totalPages = Math.ceil(total / perPage)

  return (
    <>
      {/* Tabs de géneros */}
      <CatalogueTabs
        genres={genres}
        active={genre}
        onChange={handleGenreChange}
      />

      {/* Grid */}
      <RecordGrid
        releases={releases}
        loading={loading}
        onSelect={setSelected}
        onPlay={setTrack}
      />

      {/* Paginación */}
      {totalPages > 1 && !loading && (
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: 'var(--rc-border-card)' }}
        >
          <button
            className="font-display text-xs transition-opacity disabled:opacity-30 hover:opacity-60"
            style={{ color: 'var(--rc-color-text)' }}
            onClick={handlePagePrev}
            disabled={page <= 1}
          >
            ← ANTERIOR
          </button>
          <span className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
            {page} / {totalPages}
          </span>
          <button
            className="font-display text-xs transition-opacity disabled:opacity-30 hover:opacity-60"
            style={{ color: 'var(--rc-color-text)' }}
            onClick={handlePageNext}
            disabled={page >= totalPages}
          >
            SIGUIENTE →
          </button>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <RecordModal
          release={selected}
          onClose={() => setSelected(null)}
          onPlay={t => {
            setTrack(t)
            setSelected(null)
          }}
        />
      )}

      {/* Player flotante */}
      {track && (
        <FloatingPlayer
          track={track}
          onClose={() => setTrack(null)}
        />
      )}
    </>
  )
}
