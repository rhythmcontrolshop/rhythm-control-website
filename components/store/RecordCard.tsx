'use client'
// RecordCard — Catálogo grid card
// Identidad única RC: negro + amarillo #F0E040 + blanco
// Default: bottom overlay with Marquee + compact buttons. Heart top-left over text.
// Hover: full-info overlay — details (label/year/format) ABOVE marquee so marquee
//         stays at same height as default, no text jump, badge not covered.

import { memo }       from 'react'
import Image          from 'next/image'
import { Marquee }    from '@/components/ui/Marquee'
import { useCart }    from '@/context/CartContext'
import { useLocale }  from '@/context/LocaleContext'
import FavoriteButton from '@/components/store/FavoriteButton'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeadphones } from '@fortawesome/free-solid-svg-icons'
import type { Release, PlayerTrack } from '@/types'

interface RecordCardProps {
  release: Release; onSelect: (release: Release) => void
  onPlay: (track: PlayerTrack, clipIndex: number) => void; isNew?: boolean
}

const ACCENT = '#F0E040'
const MQ_FONT = '1.3rem'
const MQ_LINE = '1.15'

/* ── Shared compact button row ── */
function CompactButtons({
  onListen, onCart, price, isAvailable, statusLabel,
}: {
  onListen: () => void; onCart: () => void
  price: string; isAvailable: boolean; statusLabel: string
}) {
  if (!isAvailable) {
    return (
      <span className="font-display" style={{ border: '1px solid #333', color: '#FFFFFF', fontSize: '0.55rem', padding: '2px 8px' }}>
        {statusLabel}
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1 w-full">
      <button
        className="flex items-center justify-center font-display transition-opacity hover:opacity-80 active:opacity-70"
        style={{ backgroundColor: ACCENT, color: '#000000', minHeight: '32px', padding: '0 10px', cursor: 'pointer', fontSize: '0.7rem' }}
        onClick={onListen}
      >
        <FontAwesomeIcon icon={faHeadphones} style={{ marginRight: '4px', fontSize: '0.6rem' }} />
      </button>
      <button
        className="flex-1 flex items-center justify-center gap-1 font-display transition-opacity hover:opacity-80 active:opacity-70"
        style={{ border: '1px solid #FFFFFF', color: '#FFFFFF', minHeight: '32px', cursor: 'pointer', fontSize: '1.1rem' }}
        onClick={onCart}
      >
        <span style={{ fontWeight: 700 }}>{price}</span>
      </button>
    </div>
  )
}

const RecordCard = memo(function RecordCard({ release, onSelect, isNew = false }: RecordCardProps) {
  const { addItem } = useCart()
  const { t } = useLocale()
  const artist      = release.artists[0] ?? '—'
  const status      = release.status ?? 'active'
  const isAvailable = status === 'active'
  const priceStr    = release.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
  const statusLabel = status === 'reserved' ? t('catalogue.reserved') : t('catalogue.sold')

  return (
    <article className="group relative z-0 overflow-hidden"
      style={{ aspectRatio: '1', backgroundColor: '#000000', cursor: 'pointer' }}
      onClick={() => onSelect(release)}>

      {/* Accent bar — left edge on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
        style={{ backgroundColor: ACCENT }} />

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
              style={{ border: '1px solid #FFFFFF', color: '#FFFFFF' }}>
              {statusLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom overlay (DEFAULT state): heart + marquee + buttons ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col
                      md:opacity-100 md:group-hover:opacity-0 md:transition-opacity md:duration-200"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent)' }}>

        {/* Heart + Marquee text — heart top-left, text full width below */}
        <div style={{ padding: '24px 8px 2px 8px' }}>
          <div className="absolute" style={{ top: '6px', left: '6px', zIndex: 20 }}>
            <FavoriteButton releaseId={release.id} discogsReleaseId={release.discogs_release_id} variant="card" size={18} />
          </div>
          <Marquee text={artist}        style={{ color: '#FFFFFF', fontSize: MQ_FONT, lineHeight: MQ_LINE }} />
          <Marquee text={release.title} style={{ color: ACCENT, fontSize: MQ_FONT, lineHeight: MQ_LINE }} />
        </div>

        {/* Compact buttons */}
        <div style={{ padding: '6px 8px 8px 8px' }}>
          <CompactButtons
            onListen={() => onSelect(release)}
            onCart={() => addItem(release)}
            price={priceStr}
            isAvailable={isAvailable}
            statusLabel={statusLabel}
          />
        </div>
      </div>

      {/* ── Hover overlay (DESKTOP ONLY): details above marquee + same buttons ── */}
      <div className="hidden md:flex absolute inset-0 flex-col justify-between
                      opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100 z-20"
        style={{ backgroundColor: '#000000', padding: '6px 8px 8px 8px' }}>

        {/* Top area: heart (top-left) + details + marquee */}
        <div style={{ paddingTop: '24px' }}>
          <div className="absolute" style={{ top: '6px', left: '6px', zIndex: 20 }}>
            <FavoriteButton releaseId={release.id} discogsReleaseId={release.discogs_release_id} variant="card" size={20} />
          </div>

          {/* Disc details ABOVE marquee — avoids badge overlap & text jump */}
          <p className="font-display text-xs font-bold" style={{ color: '#FFFFFF', paddingRight: '60px' }}>
            {release.labels[0] ?? ''}
          </p>
          <p className="font-mono mb-1" style={{ color: '#FFFFFF', fontSize: '0.65rem', paddingRight: '60px' }}>
            {[release.year, release.format].filter(Boolean).join(' · ')}
          </p>

          {/* Marquees — same size as default, at same visual position */}
          <Marquee text={artist}        style={{ color: '#FFFFFF', fontSize: MQ_FONT, lineHeight: MQ_LINE }} />
          <Marquee text={release.title} style={{ color: ACCENT, fontSize: MQ_FONT, lineHeight: MQ_LINE }} />
        </div>

        {/* Bottom area: compact buttons */}
        <CompactButtons
          onListen={() => onSelect(release)}
          onCart={() => addItem(release)}
          price={priceStr}
          isAvailable={isAvailable}
          statusLabel={statusLabel}
        />
      </div>
    </article>
  )
})

export default RecordCard
