'use client'
// components/store/RecordModal.tsx
// Modal con detalle completo, tracklist con reproductores de audio.

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Release, PlayerTrack } from '@/types'

interface RecordModalProps {
  release:  Release
  releases?: Release[]
  onClose:  () => void
  onPlay:    (track: PlayerTrack, clipIndex: number) => void
  onSelect: (release: Release) => void
  openTab?: 'tracklist' | 'notes' | 'artist' | 'label'
}

const ACCENT_CONDITIONS = ['M', 'NM']

const MOCK_TRACKLIST: Record<string, { side: string; track: string; duration: string }[]> = {
  'Strings of Life': [
    { side: 'A1', track: 'Strings of Life', duration: '6:18' },
    { side: 'A2', track: 'The Dance', duration: '5:42' },
    { side: 'B1', track: 'Nude Photo', duration: '4:55' },
    { side: 'B2', track: 'The Shuffle', duration: '5:10' },
  ],
  'Move Your Body': [
    { side: 'A', track: 'Move Your Body', duration: '7:20' },
    { side: 'B1', track: 'Move Your Body (Instrumental)', duration: '6:45' },
    { side: 'B2', track: 'Move Your Body (Dub)', duration: '5:30' },
  ],
  'Windowlicker': [
    { side: 'A', track: 'Windowlicker', duration: '6:07' },
    { side: 'B1', track: 'Equation', duration: '5:30' },
    { side: 'B2', track: 'Nannou', duration: '4:15' },
  ],
  'Pacific State': [
    { side: 'A', track: 'Pacific State', duration: '6:42' },
    { side: 'B1', track: 'Pacific State (Remix)', duration: '5:55' },
  ],
  'So What': [
    { side: 'A1', track: 'So What', duration: '9:22' },
    { side: 'A2', track: 'Freddie Freeloader', duration: '9:46' },
    { side: 'B1', track: 'Blue in Green', duration: '5:37' },
    { side: 'B2', track: 'All Blues', duration: '11:33' },
  ],
  'I Feel Love': [
    { side: 'A', track: 'I Feel Love', duration: '8:02' },
    { side: 'B', track: "Can't We Just Sit Down", duration: '4:45' },
  ],
  'Supernature': [
    { side: 'A', track: 'Supernature', duration: '10:25' },
    { side: 'B1', track: 'In The Smoke', duration: '5:40' },
    { side: 'B2', track: "L'Amour Est Mon Natur", duration: '4:30' },
  ],
  'Can You Feel It': [
    { side: 'A', track: 'Can You Feel It', duration: '7:15' },
    { side: 'B', track: 'Washing Machine', duration: '6:30' },
  ],
  'Da Funk': [
    { side: 'A', track: 'Da Funk', duration: '5:28' },
    { side: 'B1', track: 'Rollin & Scratchin', duration: '7:38' },
    { side: 'B2', track: 'Da Funk (Instrumental)', duration: '5:10' },
  ],
  'Promised Land': [
    { side: 'A', track: 'Promised Land', duration: '6:45' },
    { side: 'B', track: 'Promised Land (Instrumental)', duration: '5:55' },
  ],
}

type TabType = 'tracklist' | 'notes' | 'artist' | 'label'

export default function RecordModal({ release, releases = [], onClose, onPlay, onSelect, openTab }: RecordModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const [crossSellArtist, setCrossSellArtist] = useState<Release[]>([])
  const [crossSellLabel, setCrossSellLabel] = useState<Release[]>([])
  const [activeTab, setActiveTab] = useState<TabType>(openTab || 'tracklist')
  const [playingTrack, setPlayingTrack] = useState<number | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<number, string | null>>({})
  
  const isAccentCondition = ACCENT_CONDITIONS.includes(release.condition)
  const tracklist = MOCK_TRACKLIST[release.title] || []

  const currentIndex = releases.findIndex(r => r.id === release.id)
  const prevRelease = currentIndex > 0 ? releases[currentIndex - 1] : null
  const nextRelease = currentIndex >= 0 && currentIndex < releases.length - 1 ? releases[currentIndex + 1] : null

  const tabs: { key: TabType; label: string; available: boolean }[] = [
    { key: 'tracklist', label: 'TRACKLIST', available: tracklist.length > 0 },
    { key: 'notes', label: 'NOTAS', available: !!release.comments },
    { key: 'artist', label: `MÁS DE ${release.artists[0]?.toUpperCase()}`, available: false },
    { key: 'label', label: `MÁS DE ${release.labels[0]?.toUpperCase()}`, available: false },
  ]

  useEffect(() => {
    const sameArtist = releases.filter(r => 
      r.id !== release.id && 
      r.artists.some(a => release.artists.includes(a))
    ).slice(0, 4)
    setCrossSellArtist(sameArtist)

    const sameLabel = releases.filter(r => 
      r.id !== release.id && 
      r.labels.some(l => release.labels.includes(l))
    ).slice(0, 4)
    setCrossSellLabel(sameLabel)
  }, [release, releases])

  useEffect(() => {
    tabs[2].available = crossSellArtist.length > 0
    tabs[3].available = crossSellLabel.length > 0
  }, [crossSellArtist, crossSellLabel])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && prevRelease) onSelect(prevRelease)
      if (e.key === 'ArrowRight' && nextRelease) onSelect(nextRelease)
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prevRelease, nextRelease, onSelect])

  // Buscar previews de Spotify para cada track
  useEffect(() => {
    async function fetchPreviews() {
      if (!release.spotify_id) return
      
      const urls: Record<number, string | null> = {}
      
      for (let i = 0; i < tracklist.length; i++) {
        try {
          const res = await fetch(`/api/audio/spotify/${release.spotify_id}`)
          const data = await res.json()
          urls[i] = data.preview_url || null
          // Por ahora usamos el mismo preview para todos los tracks
          // En producción buscaríamos cada track individualmente
        } catch {
          urls[i] = null
        }
      }
      
      setPreviewUrls(urls)
    }
    
    if (tracklist.length > 0 && activeTab === 'tracklist') {
      fetchPreviews()
    }
  }, [release.spotify_id, tracklist, activeTab])

  const handlePlayTrack = (trackIndex: number) => {
    setPlayingTrack(trackIndex)
    const track: PlayerTrack = {
      release_id: release.id,
      title: tracklist[trackIndex].track,
      artist: release.artists[0] ?? '',
      cover_image: release.cover_image,
      source: 'spotify',
      source_id: release.spotify_id ?? '',
      bpm: release.bpm,
      key: release.key_camelot ?? release.key,
      price: release.price,
      currency: release.currency,
      shopify_variant_id: release.shopify_variant_id,
    }
    onPlay(track, trackIndex + 1)
  }

  const availableTabs = tabs.filter(t => t.available)

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 200 }}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      {prevRelease && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl transition-opacity hover:opacity-60 z-10"
          style={{ color: '#FFFFFF' }}
          onClick={() => onSelect(prevRelease)}
        >
          ←
        </button>
      )}

      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#000000', border: '2px solid #FFFFFF' }}
      >
        <button
          className="absolute top-4 right-4 font-display text-xs z-10 transition-opacity hover:opacity-60"
          style={{ color: '#FFFFFF' }}
          onClick={onClose}
        >
          ✕
        </button>

        <div className="flex flex-col lg:flex-row">
          <div className="relative shrink-0 w-full lg:w-[320px]" style={{ aspectRatio: '1' }}>
            {release.cover_image ? (
              <Image
                src={release.cover_image}
                alt={`${release.artists[0]} — ${release.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 320px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />
            )}
          </div>

          <div className="flex-1 p-6 lg:p-8 min-w-0 flex flex-col">
            <p className="font-display" style={{ color: '#FFFFFF', fontSize: '1.8rem', lineHeight: '1.1' }}>
              {release.artists.join(', ') || '—'}
            </p>

            <p className="font-display mt-1" style={{ color: '#F0E040', fontSize: '1.8rem', lineHeight: '1.1' }}>
              {release.title}
            </p>

            <p className="font-display text-base font-bold mt-2" style={{ color: '#FFFFFF' }}>
              {release.labels[0]} {release.catno && `· ${release.catno}`}
            </p>

            <p className="font-meta text-sm mt-1" style={{ color: '#FFFFFF' }}>
              {[release.year, release.format, release.country].filter(Boolean).join(' · ')}
            </p>

            {(release.bpm || release.key_camelot || release.key) && (
              <div className="flex gap-2 mt-4">
                {release.bpm && (
                  <span className="font-display text-sm px-2 py-1" style={{ backgroundColor: '#F0E040', color: '#000000' }}>
                    {release.bpm} BPM
                  </span>
                )}
                {(release.key_camelot ?? release.key) && (
                  <span className="font-display text-sm px-2 py-1" style={{ backgroundColor: '#F0E040', color: '#000000' }}>
                    {release.key_camelot ?? release.key}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: '1px solid #1C1C1C' }}>
              <div className="flex items-center gap-3">
                <span
                  className="font-display text-sm px-3 py-1"
                  style={isAccentCondition
                    ? { backgroundColor: '#F0E040', color: '#000000' }
                    : { border: '1px solid #FFFFFF', color: '#FFFFFF' }
                  }
                >
                  {release.condition}
                </span>
                {release.sleeve_condition && release.sleeve_condition !== release.condition && (
                  <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
                    Funda: {release.sleeve_condition}
                  </span>
                )}
              </div>
              <span className="font-display text-xl" style={{ color: '#FFFFFF' }}>
                {release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>

            <button
              className="w-full font-display text-sm py-3 mt-4 transition-colors hover:opacity-80"
              style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
              onClick={(e) => e.stopPropagation()}
            >
              AÑADIR AL CARRITO
            </button>

            {availableTabs.length > 0 && (
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid #1C1C1C' }}>
                <div className="flex flex-wrap gap-1 mb-4">
                  {availableTabs.map(tab => (
                    <button
                      key={tab.key}
                      className="font-display text-xs px-3 py-2 transition-colors"
                      style={{
                        backgroundColor: activeTab === tab.key ? '#F0E040' : 'transparent',
                        color: activeTab === tab.key ? '#000000' : '#FFFFFF',
                        border: activeTab === tab.key ? 'none' : '1px solid #FFFFFF',
                      }}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="min-h-[80px]">
                  {activeTab === 'tracklist' && tracklist.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {tracklist.map((t, i) => {
                        const isPlaying = playingTrack === i
                        const hasPreview = previewUrls[i] !== undefined
                        
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2"
                            style={{
                              borderBottom: isPlaying ? '2px solid #F0E040' : '1px solid #1C1C1C',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Botón play */}
                              <button
                                className="flex items-center justify-center transition-colors"
                                style={{
                                  width:  '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: isPlaying ? '#F0E040' : '#FFFFFF',
                                }}
                                onClick={() => handlePlayTrack(i)}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '1px' }}>
                                  <polygon points="5,3 19,12 5,21" fill="#000000" />
                                </svg>
                              </button>
                              
                              <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
                                {t.side}
                              </span>
                              <span className="font-display text-sm" style={{ color: isPlaying ? '#F0E040' : '#FFFFFF' }}>
                                {t.track}
                              </span>
                            </div>
                            
                            <span className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
                              {t.duration}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {activeTab === 'notes' && release.comments && (
                    <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>
                      {release.comments}
                    </p>
                  )}

                  {activeTab === 'artist' && crossSellArtist.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {crossSellArtist.map(r => (
                        <CrossSellCard key={r.id} release={r} onClick={() => onSelect(r)} />
                      ))}
                    </div>
                  )}

                  {activeTab === 'label' && crossSellLabel.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {crossSellLabel.map(r => (
                        <CrossSellCard key={r.id} release={r} onClick={() => onSelect(r)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {nextRelease && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 font-display text-2xl transition-opacity hover:opacity-60 z-10"
          style={{ color: '#FFFFFF' }}
          onClick={() => onSelect(nextRelease)}
        >
          →
        </button>
      )}
    </div>
  )
}

function CrossSellCard({ release, onClick }: { release: Release; onClick: () => void }) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <button
      className="relative overflow-hidden transition-transform hover:scale-105"
      style={{ aspectRatio: '1' }}
      onClick={onClick}
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}
    >
      {release.cover_image ? (
        <Image
          src={release.cover_image}
          alt={release.title}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized
        />
      ) : (
        <div className="w-full h-full" style={{ backgroundColor: '#111' }} />
      )}
      
      {showInfo && (
        <div className="absolute inset-0 flex flex-col justify-end p-2" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <p className="font-display text-xs truncate" style={{ color: '#FFFFFF' }}>{release.title}</p>
          <p className="font-display text-xs truncate" style={{ color: '#F0E040' }}>{release.artists[0]}</p>
        </div>
      )}
    </button>
  )
}
