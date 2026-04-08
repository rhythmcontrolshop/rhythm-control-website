'use client'
// components/store/RecordModal.tsx
// Overlay modal con detalle completo del disco.

import { useEffect, useRef } from 'react'
import Image               from 'next/image'
import { buildPlayerTrack } from '@/lib/utils/track'
import type { Release, PlayerTrack } from '@/types'

interface RecordModalProps {
  release: Release
  onClose: () => void
  onPlay:  (track: PlayerTrack) => void
}

const ACCENT_CONDITIONS = ['M', 'NM']

export default function RecordModal({ release, onClose, onPlay }: RecordModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const isAccentCondition = ACCENT_CONDITIONS.includes(release.condition)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--rc-color-overlay)',
        zIndex: 'var(--rc-z-modal)' as React.CSSProperties['zIndex'],
      }}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--rc-color-bg)', border: 'var(--rc-border-main)' }}
      >
        <button
          className="absolute top-4 right-4 font-display text-xs z-10 transition-opacity hover:opacity-60"
          style={{ color: 'var(--rc-color-text)' }}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row">
          <div className="relative shrink-0" style={{ width: '100%', aspectRatio: '1', maxWidth: '300px' }}>
            {release.cover_image ? (
              <Image
                src={release.cover_image}
                alt={`${release.artists[0]} — ${release.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />
            )}
          </div>

          <div className="flex flex-col justify-between p-6 flex-1 min-w-0">
            <div>
              <p className="font-display text-base leading-tight mb-1" style={{ color: 'var(--rc-color-text)' }}>
                {release.artists.join(', ') || '—'}
              </p>
              <p className="font-meta text-sm mb-3" style={{ color: 'var(--rc-color-muted)' }}>
                {release.title}
              </p>
              <p className="font-meta text-xs mb-1" style={{ color: 'var(--rc-color-muted)' }}>
                {[release.labels[0], release.catno].filter(Boolean).join(' · ')}
              </p>
              <p className="font-meta text-xs mb-4" style={{ color: 'var(--rc-color-muted)' }}>
                {[release.year, release.format, release.country].filter(Boolean).join(' · ')}
              </p>

              {(release.genres.length > 0 || release.styles.length > 0) && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {[...release.genres, ...release.styles].map(tag => (
                    <span key={tag} className="font-meta px-2 py-0.5" style={{ border: 'var(--rc-border-card)', color: 'var(--rc-color-muted)', fontSize: '0.6rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {(release.bpm || release.key_camelot || release.key) && (
                <div className="flex gap-2 mb-4">
                  {release.bpm && (
                    <span className="font-display px-2 py-1 text-xs" style={{ backgroundColor: 'var(--rc-color-accent)', color: 'var(--rc-color-bg)' }}>
                      {release.bpm} BPM
                    </span>
                  )}
                  {(release.key_camelot ?? release.key) && (
                    <span className="font-display px-2 py-1 text-xs" style={{ backgroundColor: 'var(--rc-color-accent)', color: 'var(--rc-color-bg)' }}>
                      {release.key_camelot ?? release.key}
                    </span>
                  )}
                </div>
              )}

              {release.comments && (
                <p className="font-meta text-xs mb-4" style={{ color: 'var(--rc-color-muted)', fontSize: '0.7rem' }}>
                  {release.comments}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="font-display text-xs px-2 py-1"
                    style={isAccentCondition
                      ? { backgroundColor: 'var(--rc-color-accent)', color: 'var(--rc-color-bg)' }
                      : { border: '1px solid rgba(255,255,255,0.3)', color: 'var(--rc-color-text)' }
                    }
                  >
                    {release.condition}
                  </span>
                  {release.sleeve_condition && release.sleeve_condition !== release.condition && (
                    <span className="font-meta text-xs" style={{ color: 'var(--rc-color-muted)' }}>
                      Funda: {release.sleeve_condition}
                    </span>
                  )}
                </div>
                <span className="font-display text-sm" style={{ color: 'var(--rc-color-text)' }}>
                  {release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>

              <div className="flex gap-2">
                {(release.spotify_id || release.youtube_id) && (
                  <button
                    className="flex-1 font-display py-2 transition-opacity hover:opacity-80 text-xs"
                    style={{ backgroundColor: 'var(--rc-color-text)', color: 'var(--rc-color-bg)' }}
                    onClick={() => onPlay(buildPlayerTrack(release))}
                  >
                    ▶ ESCUCHAR
                  </button>
                )}
                <button
                  className="flex-1 font-display py-2 transition-colors hover:bg-white hover:text-black text-xs"
                  style={{ border: 'var(--rc-border-main)', color: 'var(--rc-color-text)' }}
                  onClick={e => e.stopPropagation()}
                >
                  AÑADIR AL CARRITO
                </button>
              </div>
            </div>
          </div>
        </div>

        {release.spotify_id && (
          <div style={{ borderTop: 'var(--rc-border-card)' }}>
            <iframe
              src={`https://open.spotify.com/embed/track/${release.spotify_id}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={`${release.artists[0]} — ${release.title}`}
            />
          </div>
        )}
      </div>
    </div>
  )
}
