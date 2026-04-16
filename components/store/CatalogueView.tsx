'use client'
// components/store/CatalogueView.tsx
// Orquestador del catálogo: filtros, grid, modal y player.

import { useState, useCallback, useEffect } from 'react'
import CatalogueTabs  from './CatalogueTabs'
import type { SortOption } from './CatalogueTabs'
import RecordGrid     from './RecordGrid'
import RecordModal    from './RecordModal'
import FloatingPlayer from './FloatingPlayer'
import type { Release, PlayerTrack, PaginatedResponse } from '@/types'

interface CatalogueViewProps {
  initialReleases: Release[]
  initialTotal:    number
  genres:          string[]   // mantenido por compatibilidad con page.tsx
}

export default function CatalogueView({ initialReleases, initialTotal }: CatalogueViewProps) {
  const [releases,  setReleases]  = useState<Release[]>(initialReleases)
  const [total,     setTotal]     = useState(initialTotal)
  const [loading,   setLoading]   = useState(false)
  const [style,     setStyle]     = useState<string | null>(null)
  const [label,     setLabel]     = useState<string | null>(null)
  const [sort,      setSort]      = useState<SortOption>('newest')
  const [styles,    setStyles]    = useState<string[]>([])
  const [labels,    setLabels]    = useState<string[]>([])
  const [page,      setPage]      = useState(1)
  const [selected,  setSelected]  = useState<Release | null>(null)
  const [openTab,   setOpenTab]   = useState<'tracklist' | 'notes' | 'artist' | 'label' | undefined>(undefined)
  const [track,     setTrack]     = useState<PlayerTrack | null>(null)
  const [clipIndex, setClipIndex] = useState(1)

  const perPage = 24

  // Extraer estilos y sellos únicos de los releases iniciales
  useEffect(() => {
    const styleSet = new Set<string>()
    const labelSet = new Set<string>()
    initialReleases.forEach(r => {
      r.styles?.forEach(s => styleSet.add(s))
      r.labels?.forEach(l => labelSet.add(l))
    })
    setStyles(Array.from(styleSet).sort())
    setLabels(Array.from(labelSet).sort())
  }, [initialReleases])

  const fetchReleases = useCallback(async (
    activeStyle: string | null,
    activeLabel: string | null,
    activeSort:  SortOption,
    activePage:  number,
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(activePage), sort: activeSort })
      if (activeStyle) params.set('style', activeStyle)
      if (activeLabel) params.set('label', activeLabel)

      const res  = await fetch(`/api/catalogue?${params}`)
      const json = (await res.json()) as PaginatedResponse<Release>
      setReleases(json.data)
      setTotal(json.total)
    } catch {
      // silenciar errores de red
    } finally {
      setLoading(false)
    }
  }, [])

  const handleStyleChange = (s: string | null) => {
    setStyle(s); setPage(1)
    fetchReleases(s, label, sort, 1)
  }
  const handleLabelChange = (l: string | null) => {
    setLabel(l); setPage(1)
    fetchReleases(style, l, sort, 1)
  }
  const handleSortChange = (s: SortOption) => {
    setSort(s); setPage(1)
    fetchReleases(style, label, s, 1)
  }

  const handlePageNext = () => {
    const next = page + 1
    setPage(next)
    fetchReleases(style, label, sort, next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handlePagePrev = () => {
    const prev = page - 1
    setPage(prev)
    fetchReleases(style, label, sort, prev)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlay = (t: PlayerTrack, clip: number) => { setTrack(t); setClipIndex(clip) }
  const handleSelect = (r: Release, tab?: typeof openTab) => { setSelected(r); setOpenTab(tab) }

  const totalPages = Math.ceil(total / perPage)

  return (
    <>
      <CatalogueTabs
        styles={styles}       activeStyle={style}   onStyleChange={handleStyleChange}
        labels={labels}       activeLabel={label}   onLabelChange={handleLabelChange}
        sort={sort}           onSortChange={handleSortChange}
      />

      <RecordGrid
        releases={releases}
        loading={loading}
        onSelect={r => handleSelect(r)}
        onPlay={handlePlay}
      />

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #1C1C1C', marginTop: '16px' }}>
          <button
            className="font-display text-xs disabled:opacity-30 hover:opacity-60"
            style={{ color: '#FFFFFF' }}
            onClick={handlePagePrev}
            disabled={page <= 1}
          >← ANTERIOR</button>
          <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
            {page} / {totalPages}
          </span>
          <button
            className="font-display text-xs disabled:opacity-30 hover:opacity-60"
            style={{ color: '#FFFFFF' }}
            onClick={handlePageNext}
            disabled={page >= totalPages}
          >SIGUIENTE →</button>
        </div>
      )}

      {selected && (
        <RecordModal
          release={selected}
          releases={releases}
          onClose={() => setSelected(null)}
          onPlay={handlePlay}
          onSelect={r => handleSelect(r)}
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
