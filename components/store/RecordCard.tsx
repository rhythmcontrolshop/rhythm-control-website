'use client'
// components/store/RecordCard.tsx
// Card individual de un disco. Hover: imagen desaparece, muestra metadata completa.

import Image        from 'next/image'
import type { Release } from '@/types'
import type { PlayerTrack } from '@/types'

interface RecordCardProps {
  release:  Release
  onSelect: (release: Release) => void
  onPlay:   (track: PlayerTrack) => void
}

function buildPlayerTrack(release: Release): PlayerTrack {
  return {
    release_id:         release.id,
    title:              release.title,
    artist:             release.artists[0] ?? '',
    cover_image:        release.cover_image,
    source:             release.spotify_id   ? 'spotify'
                      : release.youtube_id   ? 'youtube'
                      : 'soundcloud',
    source_id:          release.spotify_id ?? release.youtube_id ?? '',
    bpm:                release.bpm,
    key:                release.key_camelot ?? release.key,
    price:              release.price,
    currency:           release.currency,
    shopify_variant_id: release.shopify_variant_id,
  }
}

const ACCENT_CONDITIONS = ['M', 'NM']

export default function RecordCard({ release, onSelect, onPlay }: RecordCardProps) {
  const isAccentCondition = ACCENT_CONDITIONS.includes(release.condition)

  return (
    <article
      className="group relative overflow-hidden cursor-pointer"
      style={{
        aspectRatio:  '1',
        borderRight:  'var(--rc-border-card)',
        borderBottom: 'var(--rc-border-card)',
      }}
      onClick={() => onSelect(release)}
    >

      {/* ── Estado por defecto: imagen + title strip ── */}
      <div className="absolute inset-0 transition-opacity duration-[250ms] group-hover:opacity-0">

        {/* Portada */}
        {release.cover_image ? (
          <Image
            src={release.cover_image}
            alt={`${release.artists[0]} — ${release.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
            unoptimized
          />
        ) : (
          <div
            className="w-full h-full flex items-end"
            style={{ backgroundColor: '#0a0a0a' }}
          />
        )}

        {/* Title strip */}
        <div
          className="absolute bottom-0 left-0 right-0 px-2 pt-4 pb-2"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent)',
          }}
        >
          <p className="font-display text-xs truncate" style={{ color: 'var(--rc-color-text)' }}>
            {release.artists[0] ?? '—'}
          </p>
          <p className="font-meta text-xs truncate mt-0.5" style={{ color: 'var(--rc-color-muted)', fontSize: '0.65rem' }}>
            {release.title}
          </p>
        </div>

      </div>

      {/* ── Estado hover: metadata ── */}
      <div
        className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100"
        style={{ backgroundColor: 'var(--rc-color-bg)' }}
      >
        {/* Top: artista + título */}
        <div>
          <p className="font-display text-sm leading-tight" style={{ color: 'var(--rc-color-text)' }}>
            {release.artists[0] ?? '—'}
          </p>
          <p className="font-meta mt-1 leading-snug" style={{ color: 'var(--rc-color-muted)', fontSize: '0.7rem' }}>
            {release.title}
          </p>
          <p className="font-meta mt-1" style={{ color: 'var(--rc-color-muted)', fontSize: '0.65rem' }}>
            {[release.labels[0], release.catno].filter(Boolean).join(' · ')}
          </p>
          <p className="font-meta" style={{ color: 'var(--rc-color-muted)', fontSize: '0.65rem' }}>
            {[release.year, release.format, release.country].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Centro: BPM + Key */}
        {(release.bpm || release.key_camelot || release.key) && (
          <div className="flex gap-1 flex-wrap">
            {release.bpm && (
              <span
                className="font-meta px-1.5 py-0.5"
                style={{ backgroundColor: 'var(--rc-color-accent)', color: 'var(--rc-color-bg)', fontSize: '0.6rem' }}
              >
                {release.bpm} BPM
              </span>
            )}
            {(release.key_camelot ?? release.key) && (
              <span
                className="font-meta px-1.5 py-0.5"
                style={{ backgroundColor: 'var(--rc-color-accent)', color: 'var(--rc-color-bg)', fontSize: '0.6rem' }}
              >
                {release.key_camelot ?? release.key}
              </span>
            )}
          </div>
        )}

        {/* Bottom: condición + precio + botones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="font-display text-xs px-1.5 py-0.5"
              style={
                isAccentCondition
                  ? { backgroundColor: 'var(--rc-color-accent)', color: 'var(--rc-color-bg)' }
                  : { border: '1px solid rgba(255,255,255,0.3)', color: 'var(--rc-color-text)' }
              }
            >
              {release.condition}
            </span>
            <span className="font-meta text-xs" style={{ color: 'var(--rc-color-text)' }}>
              {release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>

          <div className="flex gap-1">
            {/* Escuchar */}
            <button
              className="flex-1 font-display py-1.5 transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--rc-color-text)',
                color:           'var(--rc-color-bg)',
                fontSize:        '0.6rem',
              }}
              onClick={e => {
                e.stopPropagation()
                onPlay(buildPlayerTrack(release))
              }}
            >
              ▶ ESCUCHAR
            </button>

            {/* Carrito */}
            <button
              className="font-display px-2 py-1.5 transition-colors hover:bg-white hover:text-black"
              style={{
                border:    'var(--rc-border-card)',
                color:     'var(--rc-color-text)',
                fontSize:  '0.6rem',
              }}
              onClick={e => e.stopPropagation()}
            >
              +
            </button>
          </div>
        </div>

      </div>
    </article>
  )
}
