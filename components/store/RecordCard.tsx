'use client'
// components/store/RecordCard.tsx

import Image from 'next/image'
import type { Release, PlayerTrack } from '@/types'

interface RecordCardProps {
  release:  Release
  onSelect: (release: Release) => void
  onPlay:   (track: PlayerTrack, clipIndex: number) => void
}

export default function RecordCard({ release, onSelect }: RecordCardProps) {
  const artist = release.artists[0] ?? '—'

  return (
    <article
      className="group relative overflow-hidden cursor-pointer"
      style={{ aspectRatio: '1' }}
      onClick={() => onSelect(release)}
    >
      {/* Default: imagen + gradiente */}
      <div className="absolute inset-0 transition-opacity duration-[250ms] group-hover:opacity-0">
        {release.cover_image ? (
          <Image
            src={release.cover_image}
            alt={`${artist} — ${release.title}`}
            fill className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />
        )}

        <div
          className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent)' }}
        >
          <div className="marquee">
            <span className="marquee-content font-display" style={{ color: '#FFFFFF', fontSize: '1.3rem', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
              {artist}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{artist}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
          <div className="marquee">
            <span className="marquee-content font-display" style={{ color: '#F0E040', fontSize: '1.3rem', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
              {release.title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{release.title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      </div>

      {/* Hover: info completa */}
      <div
        className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="absolute top-0 left-0 bottom-0" style={{ width: '2px', backgroundColor: '#FFFFFF' }} />

        <div style={{ marginLeft: '6px' }}>
          <div className="marquee">
            <span className="marquee-content font-display" style={{ color: '#FFFFFF', fontSize: '1.3rem', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
              {artist}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{artist}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
          <div className="marquee">
            <span className="marquee-content font-display" style={{ color: '#F0E040', fontSize: '1.3rem', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
              {release.title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{release.title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
          <p className="font-display text-sm font-bold mt-1" style={{ color: '#FFFFFF' }}>{release.labels[0] ?? ''}</p>
          <p className="font-meta text-xs mt-1" style={{ color: '#FFFFFF' }}>{[release.year, release.format].filter(Boolean).join(' · ')}</p>
        </div>

        <div className="flex gap-2" style={{ marginLeft: '6px' }}>
          <button
            className="font-display text-xs px-4 py-2 transition-colors"
            style={{ backgroundColor: '#F0E040', color: '#000000' }}
            onClick={e => { e.stopPropagation(); onSelect(release) }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F0E040' }}
          >
            ESCUCHAR
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 font-display text-xs px-3 py-2"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF', backgroundColor: 'transparent' }}
            onClick={e => e.stopPropagation()}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#000000' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#FFFFFF' }}
          >
            <span style={{ fontWeight: 700 }}>{release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}
