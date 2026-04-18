'use client'
// E3-4: Removed pointer-events hack
// E3-10: Touch targets minimum 44px
// E3-14: Actions always visible on mobile (not hover-only)

import { memo }       from 'react'
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

// E4-2: React.memo evita re-renders cuando el release no cambió
const RecordCard = memo(function RecordCard({ release, onSelect, theme = 'default', isNew = false }: RecordCardProps) {
  const { addItem } = useCart()
  const { t } = useLocale()
  const artist      = release.artists[0] ?? '—'
  const accentColor = theme === 'magenta' ? '#FF00FF' : theme === 'green' ? '#77DD77' : 'var(--rc-color-accent)'
  const accentHex   = theme === 'magenta' ? '#FF00FF' : theme === 'green' ? '#77DD77' : '#F0E040'
  const status      = release.status ?? 'active'
  const isAvailable = status === 'active'

  return (
    <>
      <article className="group relative overflow-hidden"
        style={{ aspectRatio: '1', backgroundColor: 'var(--rc-color-bg)', cursor: 'pointer' }}
        onClick={() => onSelect(release)}>

        <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
          style={{ backgroundColor: accentColor }} />

        {/* Cover image — always visible, fades on hover (desktop only) */}
        <div className="absolute inset-0 md:transition-opacity md:duration-[250ms] md:group-hover:opacity-0">
          {release.cover_image
            ? <Image src={release.cover_image} alt={`${artist} — ${release.title}`}
                fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" />
            : <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />}
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <span className="font-display text-xs px-3 py-1"
                style={{ border: '1px solid var(--rc-color-text)', color: 'var(--rc-color-text)' }}>
                {status === 'reserved' ? t('catalogue.reserved') : t('catalogue.sold')}
              </span>
            </div>
          )}
          {/* Gradient overlay with artist/title — always visible */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent)' }}>
            <Marquee text={artist}        style={{ color: 'var(--rc-color-text)', fontSize: '1.3rem', lineHeight: '1.1' }} />
            <Marquee text={release.title} style={{ color: accentColor, fontSize: '1.3rem', lineHeight: '1.1' }} />
          </div>

          {/* E3-14: Mobile-only action bar — always visible, not hover-only */}
          {isAvailable && (
            <div className="md:hidden absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 pb-1 z-10"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 30%, transparent)' }}>
              <button
                className="flex items-center justify-center font-display text-[0.65rem] px-2 active:opacity-70"
                style={{ backgroundColor: accentHex, color: '#000000', minHeight: '36px', minWidth: '36px' }}
                onClick={e => { e.stopPropagation(); onSelect(release) }}>
                ESCUCHAR
              </button>
              <button
                className="flex items-center justify-center gap-1 font-display text-[0.65rem] px-2 active:opacity-70"
                style={{ border: '1px solid #FFFFFF', color: '#FFFFFF', minHeight: '36px' }}
                onClick={e => { e.stopPropagation(); addItem(release) }}>
                <span style={{ fontWeight: 700 }}>
                  {release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* E3-4: Hover state (desktop only) — NO pointer-events hack */}
        <div className="hidden md:flex absolute inset-0 flex-col justify-between p-4 opacity-0 md:transition-opacity md:duration-[250ms] md:group-hover:opacity-100"
          style={{ backgroundColor: 'var(--rc-color-bg)' }}>
          <div style={{ marginLeft: '6px' }}>
            <Marquee text={artist}        style={{ color: 'var(--rc-color-text)', fontSize: '1.3rem', lineHeight: '1.1' }} />
            <Marquee text={release.title} style={{ color: accentColor, fontSize: '1.3rem', lineHeight: '1.1' }} />
            <p className="font-display text-sm font-bold mt-1" style={{ color: 'var(--rc-color-text)' }}>{release.labels[0] ?? ''}</p>
            <p className="font-meta text-xs mt-1" style={{ color: 'var(--rc-color-text)' }}>{[release.year, release.format].filter(Boolean).join(' · ')}</p>
          </div>

          <div className="relative">
            <FavoriteButton releaseId={release.id} discogsReleaseId={release.discogs_release_id} variant="card" size={16} theme={theme} />
            <div className="flex gap-2" style={{ marginLeft: '6px' }}>
              {/* E3-10: 44px min touch target */}
              <button className="font-display text-xs px-4 py-2 transition-opacity hover:opacity-80"
                style={{ backgroundColor: accentHex, color: '#000000', cursor: 'pointer', minHeight: '44px' }}
                onClick={e => { e.stopPropagation(); onSelect(release) }}>
                {t('btn.listen')}
              </button>
              {isAvailable ? (
                <button className="flex-1 flex items-center justify-center gap-1 font-display text-xs px-2 transition-opacity hover:opacity-80"
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
})

export default RecordCard
