'use client'
import { useState }   from 'react'
import Image          from 'next/image'
import { Marquee }    from '@/components/ui/Marquee'
import { useCart }    from '@/context/CartContext'
import { useLocale }  from '@/context/LocaleContext'
import FavoriteButton from '@/components/store/FavoriteButton'
import type { Release, PlayerTrack } from '@/types'

interface RecordCardProps {
  release: Release; onSelect: (release: Release) => void
  onPlay: (track: PlayerTrack, clipIndex: number) => void; theme?: 'default' | 'magenta' | 'green'
  isNew?: boolean
}

export default function RecordCard({ release, onSelect, theme = 'default', isNew = false }: RecordCardProps) {
  const { addItem } = useCart()
  const { t } = useLocale()
  const artist      = release.artists[0] ?? '—'
  const accentColor = theme === 'magenta' ? '#FF00FF' : theme === 'green' ? '#77DD77' : '#F0E040'
  const status      = (release as any).status ?? 'active'
  const isAvailable = status === 'active'

  return (
    <>
      <article className="group relative overflow-hidden"
        style={{ aspectRatio: '1', backgroundColor: '#000000', cursor: 'pointer' }}
        onClick={() => onSelect(release)}>

        <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
          style={{ backgroundColor: accentColor }} />

        {/* Cover image — always visible, fades on hover (desktop only) */}
        <div className="absolute inset-0 md:transition-opacity md:duration-[250ms] md:group-hover:opacity-0">
          {release.cover_image
            ? <Image src={release.cover_image} alt={`${artist} — ${release.title}`}
                fill className="object-cover" sizes="(max-width: 768px) 50vw, 16vw" />
            : <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />}
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <span className="font-display text-xs px-3 py-1"
                style={{ border: '1px solid #FFFFFF', color: '#FFFFFF' }}>
                {status === 'reserved' ? t('catalogue.reserved') : t('catalogue.sold')}
              </span>
            </div>
          )}
          {/* Gradient overlay with artist/title — always visible */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent)' }}>
            <Marquee text={artist}        style={{ color: '#FFFFFF',   fontSize: '1.3rem', lineHeight: '1.1' }} />
            <Marquee text={release.title} style={{ color: accentColor, fontSize: '1.3rem', lineHeight: '1.1' }} />
          </div>

          {/* Mobile-only quick-add button — always visible on touch devices */}
          {isAvailable && (
            <button
              className="md:hidden absolute bottom-2 right-2 flex items-center justify-center z-10"
              style={{ width: '44px', height: '44px', backgroundColor: accentColor, color: '#000000', flexShrink: 0 }}
              onClick={e => { e.stopPropagation(); addItem(release) }}
              aria-label={`Añadir ${release.title} al carrito`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </button>
          )}
        </div>

        {/* Hover state (desktop only) */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 md:transition-opacity md:duration-[250ms] md:group-hover:opacity-100"
          style={{ backgroundColor: '#000000', pointerEvents: 'none' }}
          // pointer-events none by default; desktop hover re-enables via group
        >
          <div style={{ marginLeft: '6px' }}>
            <Marquee text={artist}        style={{ color: '#FFFFFF',   fontSize: '1.3rem', lineHeight: '1.1' }} />
            <Marquee text={release.title} style={{ color: accentColor, fontSize: '1.3rem', lineHeight: '1.1' }} />
            <p className="font-display text-sm font-bold mt-1" style={{ color: '#FFFFFF' }}>{release.labels[0] ?? ''}</p>
            <p className="font-meta text-xs mt-1" style={{ color: '#FFFFFF' }}>{[release.year, release.format].filter(Boolean).join(' · ')}</p>
          </div>

          <div className="relative" style={{ pointerEvents: 'auto' }}>
            <FavoriteButton releaseId={release.id} discogsReleaseId={release.discogs_release_id} variant="card" size={16} theme={theme} />
            <div className="flex gap-2" style={{ marginLeft: '6px' }}>
              <button className="font-display text-xs px-4 py-2"
                style={{ backgroundColor: accentColor, color: '#000000', cursor: 'pointer', minHeight: '44px' }}
                onClick={e => { e.stopPropagation(); onSelect(release) }}>
                {t('btn.listen')}
              </button>
              {isAvailable ? (
                <button className="flex-1 flex items-center justify-center gap-1 font-display text-xs px-2"
                  style={{ border: '2px solid #FFFFFF', color: '#FFFFFF', cursor: 'pointer', minHeight: '44px' }}
                  onClick={e => { e.stopPropagation(); addItem(release) }}>
                  <span style={{ fontWeight: 700 }}>
                    {release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </button>
              ) : (
                <span className="flex-1 flex items-center justify-center font-display text-xs"
                  style={{ border: '1px solid #333', color: '#FFFFFF' }}>
                  {status === 'reserved' ? t('catalogue.reserved') : t('catalogue.sold')}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
