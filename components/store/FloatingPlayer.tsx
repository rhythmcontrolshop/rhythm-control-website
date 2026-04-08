'use client'
// components/store/FloatingPlayer.tsx
// Player flotante fijo en la parte inferior.
// Muestra portada, artista, título, BPM/key, y controles.
// Spotify embed como fuente de audio principal.

import Image from 'next/image'
import type { PlayerTrack } from '@/types'

interface FloatingPlayerProps {
  track:   PlayerTrack
  onClose: () => void
}

export default function FloatingPlayer({ track, onClose }: FloatingPlayerProps) {
  return (
    <div
      className="fixed left-0 right-0 bottom-0 flex items-stretch"
      style={{
        height:          'var(--rc-player-height)',
        backgroundColor: 'var(--rc-color-bg)',
        borderTop:       'var(--rc-border-main)',
        zIndex:          'var(--rc-z-player)' as React.CSSProperties['zIndex'],
      }}
    >
      {/* Portada */}
      <div className="relative shrink-0" style={{ width: 'var(--rc-player-height)' }}>
        {track.cover_image ? (
          <Image
            src={track.cover_image}
            alt={`${track.artist} — ${track.title}`}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />
        )}
      </div>

      {/* Spotify embed (oculto visualmente, activa el audio) */}
      {track.source === 'spotify' && track.source_id && (
        <div className="shrink-0" style={{ width: 0, overflow: 'hidden' }}>
          <iframe
            key={track.source_id}
            src={`https://open.spotify.com/embed/track/${track.source_id}?utm_source=generator&theme=0`}
            width="300"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            title={`${track.artist} — ${track.title}`}
          />
        </div>
      )}

      {/* Info del track */}
      <div className="flex flex-col justify-center px-4 flex-1 min-w-0">
        <p className="font-display text-xs truncate" style={{ color: 'var(--rc-color-text)' }}>
          {track.artist}
        </p>
        <p className="font-meta truncate mt-0.5" style={{ color: 'var(--rc-color-muted)', fontSize: '0.65rem' }}>
          {track.title}
        </p>
      </div>

      {/* BPM + Key — solo desktop */}
      {(track.bpm || track.key_camelot || track.key) && (
        <div className="hidden md:flex items-center gap-2 px-4 shrink-0">
          {track.bpm && (
            <span
              className="font-meta px-2 py-0.5"
              style={{ backgroundColor: 'var(--rc-color-accent)', color: 'var(--rc-color-bg)', fontSize: '0.6rem' }}
            >
              {track.bpm} BPM
            </span>
          )}
          {(track.key_camelot ?? track.key) && (
            <span
              className="font-meta px-2 py-0.5"
              style={{ backgroundColor: 'var(--rc-color-accent)', color: 'var(--rc-color-bg)', fontSize: '0.6rem' }}
            >
              {track.key_camelot ?? track.key}
            </span>
          )}
        </div>
      )}

      {/* Precio + Cerrar */}
      <div className="flex items-center gap-4 px-4 shrink-0">
        <span
          className="hidden sm:block font-display text-xs"
          style={{ color: 'var(--rc-color-text)' }}
        >
          {track.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
        </span>
        <button
          className="font-meta text-xs transition-opacity hover:opacity-60"
          style={{ color: 'var(--rc-color-muted)' }}
          onClick={onClose}
          aria-label="Cerrar player"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
