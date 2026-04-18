'use client'
// E3-7: Images stacked vertically on mobile (flex-col)
// E3-23: iOS scroll lock fix using scrollY restore instead of position:fixed

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Release, PlayerTrack } from '@/types'
import { TrackPlayers } from '@/components/player/TrackPlayers'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import ReserveModal from './ReserveModal'
import FavoriteButton from './FavoriteButton'

interface RecordModalProps {
  release: Release
  releases?: Release[]
  onClose: () => void
  onPlay: (track: PlayerTrack, clipIndex: number) => void
  onSelect: (release: Release) => void
  openTab?: 'tracklist' | 'notes' | 'artist' | 'label'
  theme?: 'default' | 'magenta'
}

const ACCENT_CONDITIONS = ['M', 'NM']

type TabType = 'tracklist' | 'notes' | 'artist' | 'label'

export default function RecordModal({ release, releases = [], onClose, onPlay, onSelect, openTab, theme = 'default' }: RecordModalProps) {
  const { addItem, openCart } = useCart()
  const { t } = useLocale()
  const backdropRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<TabType>(openTab || 'tracklist')
  const [showReserve, setShowReserve] = useState(false)

  const accentColor = theme === 'magenta' ? '#FF00FF' : '#F0E040'
  const guardiColor = theme === 'magenta' ? '#FF00FF' : '#F0E040'
  const isAccentCondition = ACCENT_CONDITIONS.includes(release.condition)
  const tracklist = release.discogs_tracklist?.length
    ? release.discogs_tracklist
    : []

  const currentIndex = releases.findIndex(r => r.id === release.id)
  const prevRelease = currentIndex > 0 ? releases[currentIndex - 1] : null
  const nextRelease = currentIndex >= 0 && currentIndex < releases.length - 1 ? releases[currentIndex + 1] : null

  const status = release.status ?? 'active'
  const isAvailable = status === 'active'

  const tabs: { key: TabType; label: string; available: boolean }[] = [
    { key: 'tracklist', label: t('catalogue.tracklist'), available: tracklist.length > 0 },
    { key: 'notes', label: t('catalogue.notes'), available: !!release.comments },
    { key: 'artist', label: `${t('catalogue.moreFrom')} ${release.artists[0]?.toUpperCase()}`, available: false },
    { key: 'label', label: `${t('catalogue.moreFrom')} ${release.labels[0]?.toUpperCase()}`, available: false },
  ]

  // E3-23: iOS-safe scroll lock using overflow:hidden instead of position:fixed
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && prevRelease) onSelect(prevRelease)
      if (e.key === 'ArrowRight' && nextRelease) onSelect(nextRelease)
    }
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [onClose, prevRelease, nextRelease, onSelect])

  const availableTabs = tabs.filter(t_item => t_item.available)

  const handleAddToCart = () => {
    addItem(release)
    openCart()
  }

  return (
    <>
      <div ref={backdropRef} className="fixed inset-0 flex items-center justify-center p-2 md:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 200 }}
        onClick={e => { if (e.target === backdropRef.current) onClose() }}>

        {/* Prev button — 44×88 touch target */}
        {prevRelease && (
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 font-display text-xl z-10 flex items-center justify-center"
            style={{ width: '44px', height: '88px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFFFFF' }}
            onClick={() => onSelect(prevRelease)}>←</button>
        )}

        <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col md:flex-row"
          style={{ backgroundColor: '#000000', border: '2px solid #FFFFFF' }}>

          {/* Close button — 44×44 touch target */}
          <button
            className="absolute top-0 right-0 z-10 flex items-center justify-center font-display text-xs"
            style={{ width: '44px', height: '44px', color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={onClose}>✕</button>

          {/* E3-7: Images stacked vertically on mobile (flex-col) */}
          <div className="flex flex-col md:flex-col shrink-0 w-full md:w-[300px] md:border-r-2 md:border-b-0 border-b-2 border-white">
            <div className="relative w-full" style={{ aspectRatio: '1' }}>
              {release.cover_image
                ? <Image src={release.cover_image} alt={`${release.title} Front`} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 300px" />
                : <div className="w-full h-full bg-black" />}
            </div>
            <div className="relative w-full border-t-2 md:border-t-2 border-white" style={{ aspectRatio: '1' }}>
              {release.back_cover_image
                ? <Image src={release.back_cover_image} alt={`${release.title} Back`} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 300px" />
                : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#111' }}>
                    <span className="font-display text-xs" style={{ color: '#333' }}>{t('catalogue.noBack')}</span>
                  </div>}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 flex flex-col overflow-y-auto">
            <p className="font-display" style={{ color: '#FFFFFF', fontSize: '1.8rem', lineHeight: '1.1' }}>{release.artists.join(', ') || '—'}</p>
            <p className="font-display mt-1" style={{ color: accentColor, fontSize: '1.8rem', lineHeight: '1.1' }}>{release.title}</p>
            <p className="font-display text-base font-bold mt-2" style={{ color: '#FFFFFF' }}>{release.labels[0]} {release.catno && `· ${release.catno}`}</p>
            <p className="font-meta text-sm mt-1" style={{ color: '#FFFFFF' }}>{[release.year, release.format, release.country].filter(Boolean).join(' · ')}</p>

            {(release.bpm || release.key_camelot || release.key) && (
              <div className="flex gap-2 mt-4">
                {release.bpm && <span className="font-display text-sm px-2 py-1" style={{ backgroundColor: accentColor, color: '#000000' }}>{release.bpm} BPM</span>}
                {(release.key_camelot ?? release.key) && <span className="font-display text-sm px-2 py-1" style={{ backgroundColor: accentColor, color: '#000000' }}>{release.key_camelot ?? release.key}</span>}
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: '1px solid #1C1C1C' }}>
              <div className="flex items-center gap-3">
                <span className="font-display text-sm px-3 py-1"
                  style={isAccentCondition ? { backgroundColor: accentColor, color: '#000000' } : { border: '1px solid #FFFFFF', color: '#FFFFFF' }}>
                  {release.condition}
                </span>
              </div>
              <span className="font-display text-xl" style={{ color: '#FFFFFF' }}>
                {release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>

            {/* Actions */}
            {isAvailable ? (
              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  className="flex-1 font-display text-sm transition-colors hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#FFFFFF', color: '#000000', minHeight: '44px' }}
                  onClick={handleAddToCart}>
                  AÑADIR
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                  </svg>
                </button>
                <button
                  className="font-display text-sm px-4 transition-colors hover:opacity-80"
                  style={{ border: `2px solid ${guardiColor}`, color: guardiColor, backgroundColor: 'transparent', minHeight: '44px' }}
                  onClick={() => setShowReserve(true)}>
                  GUARDI
                </button>
                <FavoriteButton releaseId={release.id} discogsReleaseId={release.discogs_release_id} variant="modal" theme={theme} />
              </div>
            ) : (
              <div className="flex gap-2 mt-4">
                <div className="flex-1 text-center font-display text-sm flex items-center justify-center"
                  style={{ border: '1px solid #333', color: '#666', minHeight: '44px' }}>
                  {status === 'reserved' ? t('catalogue.reserved') : t('catalogue.sold')}
                </div>
                <FavoriteButton releaseId={release.id} discogsReleaseId={release.discogs_release_id} variant="modal" theme={theme} />
              </div>
            )}

            {availableTabs.length > 0 && (
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid #1C1C1C' }}>
                <div className="flex flex-wrap gap-1 mb-4">
                  {availableTabs.map(tab => (
                    <button key={tab.key} className="font-display text-xs px-3 py-2"
                      style={{ backgroundColor: activeTab === tab.key ? accentColor : 'transparent', color: activeTab === tab.key ? '#000000' : '#FFFFFF', border: activeTab === tab.key ? 'none' : '1px solid #FFFFFF', minHeight: '44px' }}
                      onClick={() => setActiveTab(tab.key)}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="min-h-[80px]">
                  {activeTab === 'tracklist' && tracklist.length > 0 && <TrackPlayers tracks={tracklist} artist={release.artists[0] ?? ''} releaseId={release.id} />}
                  {activeTab === 'notes' && release.comments && <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>{release.comments}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next button — large touch target */}
        {nextRelease && (
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 font-display text-xl z-10 flex items-center justify-center"
            style={{ width: '44px', height: '88px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFFFFF' }}
            onClick={() => onSelect(nextRelease)}>→</button>
        )}
      </div>

      {showReserve && isAvailable && (
        <ReserveModal release={release} onClose={() => setShowReserve(false)} onSuccess={() => setShowReserve(false)} />
      )}
    </>
  )
}
