'use client'
// RecordCard — Catálogo grid card
// Default state: compact bottom overlay with Marquee text + small buttons
// Desktop hover: bottom overlay fades OUT, full-info overlay fades IN with same compact buttons
// FavoriteButton repositioned to top-right in hover overlay
// Badge-safe: Hero badges (z-10 outside card) are never covered by card internals

import { memo }       from 'react'
import Image          from 'next/image'
import { Marquee }    from '@/components/ui/Marquee'
import { useCart }    from '@/context/CartContext'
import { useLocale }  from '@/context/LocaleContext'
import FavoriteButton from '@/components/store/FavoriteButton'
import type { Release, PlayerTrack } from '@/types'

interface RecordCardProps {
  release: Release; onSelect: (release: Release) => void
  onPlay: (track: PlayerTrack, clipIndex: number) => void; theme?: 'default' | 'magenta' | 'red' | 'green' | 'stock'
  isNew?: boolean
}

/* ── Shared compact button row ── */
function CompactButtons({
  accentHex, onListen, onCart, price, isAvailable, statusLabel, fontSize = '0.55rem', minHeight = '26px',
}: {
  accentHex: string; onListen: () => void; onCart: () => void
  price: string; isAvailable: boolean; statusLabel: string
  fontSize?: string; minHeight?: string
}) {
  if (!isAvailable) {
    return (
      <span className="font-display" style={{ border: '1px solid #333', color: '#FFFFFF', fontSize, padding: '2px 8px' }}>
        {statusLabel}
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1 w-full">
      <button
        className="flex items-center justify-center font-display transition-opacity hover:opacity-80 active:opacity-70"
        style={{ backgroundColor: accentHex, color: '#000000', minHeight, padding: '0 8px', cursor: 'pointer', fontSize }}
        onClick={onListen}
      >
        LISTEN
      </button>
      <button
        className="flex-1 flex items-center justify-center gap-1 font-display transition-opacity hover:opacity-80 active:opacity-70"
        style={{ border: '1px solid #FFFFFF', color: '#FFFFFF', minHeight, cursor: 'pointer', fontSize }}
        onClick={onCart}
      >
        <span style={{ fontWeight: 700 }}>{price}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
        </svg>
      </button>
    </div>
  )
}

const RecordCard = memo(function RecordCard({ release, onSelect, theme = 'default', isNew = false }: RecordCardProps) {
  const { addItem } = useCart()
  const { t } = useLocale()
  const artist      = release.artists[0] ?? '—'
  const accentColor = theme === 'magenta' ? '#FF00FF' : theme === 'red' ? '#F03E3E' : theme === 'green' ? '#77DD77' : theme === 'stock' ? '#9E9893' : 'var(--rc-color-accent)'
  const accentHex   = theme === 'magenta' ? '#FF00FF' : theme === 'red' ? '#F03E3E' : theme === 'green' ? '#77DD77' : theme === 'stock' ? '#9E9893' : '#F0E040'
  const status      = release.status ?? 'active'
  const isAvailable = status === 'active'
  const priceStr    = release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
  const statusLabel = status === 'reserved' ? t('catalogue.reserved') : t('catalogue.sold')

  return (
    <article className="group relative z-0 overflow-hidden"
      style={{ aspectRatio: '1', backgroundColor: 'var(--rc-color-bg)', cursor: 'pointer' }}
      onClick={() => onSelect(release)}>

      {/* Accent bar — left edge on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
        style={{ backgroundColor: accentColor }} />

      {/* Cover image — always visible, fades on hover (desktop) */}
      <div className="absolute inset-0 md:transition-opacity md:duration-200 md:group-hover:opacity-0">
        {release.cover_image
          ? <Image src={release.cover_image} alt={`${artist} — ${release.title}`}
              fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" />
          : <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <span className="font-display text-xs px-3 py-1"
              style={{ border: '1px solid var(--rc-color-text)', color: 'var(--rc-color-text)' }}>
              {statusLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom overlay (DEFAULT state): Marquee + compact buttons ── */}
      {/* Fades OUT on desktop hover so the full-info overlay can show */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col
                      md:opacity-100 md:group-hover:opacity-0 md:transition-opacity md:duration-200"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 50%, transparent)' }}>

        {/* Marquee text */}
        <div style={{ padding: '20px 8px 2px 8px' }}>
          <Marquee text={artist}        style={{ color: 'var(--rc-color-text)', fontSize: '0.7rem', lineHeight: '1.25' }} />
          <Marquee text={release.title} style={{ color: accentColor, fontSize: '0.7rem', lineHeight: '1.25' }} />
        </div>

        {/* Compact buttons */}
        <div style={{ padding: '4px 8px 6px 8px' }}>
          <CompactButtons
            accentHex={accentHex}
            onListen={() => onSelect(release)}
            onCart={() => addItem(release)}
            price={priceStr}
            isAvailable={isAvailable}
            statusLabel={statusLabel}
          />
        </div>
      </div>

      {/* ── Hover overlay (DESKTOP ONLY): full info + same compact buttons ── */}
      {/* z-20 ensures it's above the fading bottom overlay (z-10) */}
      <div className="hidden md:flex absolute inset-0 flex-col justify-between
                      opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100 z-20"
        style={{ backgroundColor: 'var(--rc-color-bg)', padding: '12px' }}>

        {/* Top area: info + heart */}
        <div>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-2">
              <Marquee text={artist}        style={{ color: 'var(--rc-color-text)', fontSize: '1rem', lineHeight: '1.2' }} />
              <Marquee text={release.title} style={{ color: accentColor, fontSize: '1rem', lineHeight: '1.2' }} />
            </div>
            <FavoriteButton releaseId={release.id} discogsReleaseId={release.discogs_release_id} variant="card" size={16} theme={theme} />
          </div>
          <p className="font-display text-xs font-bold mt-1" style={{ color: 'var(--rc-color-text)' }}>
            {release.labels[0] ?? ''}
          </p>
          <p className="font-mono mt-0.5" style={{ color: 'var(--rc-color-text)', fontSize: '0.65rem' }}>
            {[release.year, release.format].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Bottom area: compact buttons (same style, slightly taller for hover) */}
        <CompactButtons
          accentHex={accentHex}
          onListen={() => onSelect(release)}
          onCart={() => addItem(release)}
          price={priceStr}
          isAvailable={isAvailable}
          statusLabel={statusLabel}
          fontSize="0.6rem"
          minHeight="30px"
        />
      </div>
    </article>
  )
})

export default RecordCard
