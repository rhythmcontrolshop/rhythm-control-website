'use client'
// components/home/Hero.tsx
// Tabs horizontales (izquierda) + marquee (derecha) + contenido bajo.

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import RecordCard     from '@/components/store/RecordCard'
import RecordModal    from '@/components/store/RecordModal'
import FloatingPlayer from '@/components/store/FloatingPlayer'
import type { Release, PlayerTrack } from '@/types'
import { Marquee } from '@/components/ui/Marquee'

type HeroTab = 'top' | 'mix' | 'events'

// ── Mock data ──────────────────────────────────────────────────────────────────

const BADGES = ['STAFF PICK', 'NEW!', 'ON HYPE', 'STAFF PICK', 'NEW!', 'ON HYPE'] as const

const MOCK_EVENTS = [
  {
    id:        'e1',
    date:      'ABR 18',
    type:      'DJ SET',
    title:     'RHYTHM CONTROL × MOOG',
    venue:     'Moog Club, Barcelona',
    lineup:    ['Selector', 'Guest DJ'],
    flyer_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=600&fit=crop' as string | null,
    web:       'https://moogbarcelona.com' as string | null,
  },
  {
    id:        'e2',
    date:      'ABR 25',
    type:      'SESIÓN',
    title:     'DEEP FACTORY VOL.12',
    venue:     'Sala Apolo, Barcelona',
    lineup:    ['Larry Deep', 'Marta S.', 'Xavi R.'],
    flyer_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=600&fit=crop' as string | null,
    web:       null as string | null,
  },
  {
    id:        'e3',
    date:      'MAY 03',
    type:      'ALL NIGHT',
    title:     'TECHNO MARATHON',
    venue:     'Nitsa Club, Barcelona',
    lineup:    ['Surgeon', 'Paula Temple'],
    flyer_url: null as string | null,
    web:       null as string | null,
  },
]

const MIX = {
  date:      '2026-04-01',
  embed:     'https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=0&feed=%2Frhythmcontrolshop%2F',
  dj:        'RC SELECTOR',
  origin:    'Barcelona',
  dj_image:  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=440&fit=crop',
  bio:       'Residente en Rhythm Control. Especialista en house, techno y jazz electrónico.',
  web:       null as string | null,
  instagram: null as string | null,
  mixcloud:  'https://www.mixcloud.com/rhythmcontrolshop/' as string | null,
  tracklist: 'Strings of Life · Move Your Body · Pacific State · I Feel Love · Da Funk · Can You Feel It · Promised Land · Supernature · So What · Mystery of Love',
}

function getMixLabel() {
  const d   = new Date(MIX.date)
  const mes = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][d.getMonth()]
  return `MIX ${mes} ${String(d.getFullYear()).slice(2)}`
}

// ── FlyerModal ─────────────────────────────────────────────────────────────────

function FlyerModal({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div
      ref={bgRef}
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 300 }}
      onClick={e => { if (e.target === bgRef.current) onClose() }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden"
        style={{ border: '2px solid #FFFFFF', backgroundColor: '#000000' }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 font-display text-xs z-10 hover:opacity-60"
          style={{ color: '#FFFFFF' }}
        >✕</button>
        <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
          <Image src={src} alt={`Flyer: ${title}`} fill style={{ objectFit: 'cover' }} sizes="400px" />
        </div>
        <div className="p-4" style={{ borderTop: '1px solid #1C1C1C' }}>
          <p className="font-display" style={{ color: '#FFFFFF', fontSize: '0.85rem' }}>{title}</p>
        </div>
      </div>
    </div>
  )
}

// ── TopContent ─────────────────────────────────────────────────────────────────

function TopContent({
  releases, onSelect, onPlay,
}: {
  releases: Release[]
  onSelect: (r: Release) => void
  onPlay:   (t: PlayerTrack, clip: number) => void
}) {
  if (releases.length === 0) return null

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: 'repeat(var(--rc-grid-cols), 1fr)' }}
    >
      {releases.map((release, i) => (
        <div
          key={release.discogs_listing_id}
          className="relative"
          style={{ borderRight: '1px solid #1C1C1C', borderBottom: '1px solid #1C1C1C' }}
        >
          {/* Badge */}
          <span
            className="font-display"
            style={{
              position:        'absolute',
              top:             '6px',
              right:           '6px',
              backgroundColor: '#F0E040',
              color:           '#000000',
              fontSize:        '0.5rem',
              padding:         '2px 6px',
              zIndex:          10,
              pointerEvents:   'none',
            }}
          >
            {BADGES[i % BADGES.length]}
          </span>
          <RecordCard release={release} onSelect={onSelect} onPlay={onPlay} />
        </div>
      ))}
    </div>
  )
}

// ── MixContent ─────────────────────────────────────────────────────────────────

function MixContent() {
  const djMarquee = `${MIX.dj} — ${MIX.origin}`

  return (
    <div style={{ display: 'flex', minHeight: '220px' }}>
      {/* Imagen DJ */}
      <div
        className="hidden md:block"
        style={{ width: 'calc(100% / 6)', flexShrink: 0, position: 'relative', borderRight: '1px solid #1C1C1C', overflow: 'hidden' }}
      >
        <Image src={MIX.dj_image} alt={MIX.dj} fill style={{ objectFit: 'cover', objectPosition: 'top' }} sizes="240px" />
      </div>

      {/* Embed */}
      <div style={{ flex: 1, borderRight: '1px solid #1C1C1C', overflow: 'hidden' }}>
        <iframe
          title={getMixLabel()}
          src={MIX.embed}
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block', minHeight: '220px' }}
          allow="autoplay"
        />
      </div>

      {/* Info */}
      <div
        className="hidden md:flex flex-col"
        style={{ width: 'calc(100% / 6 * 2)', flexShrink: 0 }}
      >
        <div style={{ height: '42px', borderBottom: '1px solid #1C1C1C', flexShrink: 0 }}>
          <Marquee text={djMarquee} style={{ color: '#FFFFFF', fontSize: '1.3rem', lineHeight: '1.1', paddingLeft: '12px', height: '42px', display: 'flex', alignItems: 'center' }} />
        </div>
        <div style={{ flex: 1, padding: '14px', display: 'flex', alignItems: 'center' }}>
          <p className="font-meta" style={{ color: '#FFFFFF', fontSize: '0.62rem', lineHeight: 1.6, opacity: 0.7 }}>
            {MIX.bio}
          </p>
        </div>
        <div className="flex gap-4" style={{ padding: '12px 14px', borderTop: '1px solid #1C1C1C' }}>
          {MIX.web && (
            <a href={MIX.web} target="_blank" rel="noopener noreferrer"
              className="font-display" style={{ color: '#F0E040', fontSize: '0.62rem', textDecoration: 'none' }}>
              WEB
            </a>
          )}
          {MIX.instagram && (
            <a href={MIX.instagram} target="_blank" rel="noopener noreferrer"
              className="font-display" style={{ color: '#F0E040', fontSize: '0.62rem', textDecoration: 'none' }}>
              INSTAGRAM
            </a>
          )}
          {MIX.mixcloud && (
            <a href={MIX.mixcloud} target="_blank" rel="noopener noreferrer"
              className="font-display" style={{ color: '#F0E040', fontSize: '0.62rem', textDecoration: 'none' }}>
              MIXCLOUD →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── EventsContent ──────────────────────────────────────────────────────────────

function EventsContent({ onFlyer }: { onFlyer: (f: { url: string; title: string }) => void }) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3"
      style={{ minHeight: '220px' }}
    >
      {MOCK_EVENTS.map((event, i) => {
        const marqueeText = `${event.title} — ${event.venue}`
        const hasFlyer    = Boolean(event.flyer_url)
        const hasWeb      = Boolean(event.web)

        return (
          <div
            key={event.id}
            style={{
              display:       'flex',
              flexDirection: 'column',
              padding:       '20px',
              borderRight:   i < MOCK_EVENTS.length - 1 ? '1px solid #1C1C1C' : 'none',
              borderBottom:  '1px solid #1C1C1C',
            }}
          >
            {/* Fecha + tipo */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px', flexShrink: 0 }}>
              <span className="font-display" style={{ color: '#F0E040', fontSize: '0.75rem' }}>{event.date}</span>
              <span className="font-meta"    style={{ color: '#FFFFFF', fontSize: '0.55rem', opacity: 0.45 }}>{event.type}</span>
            </div>

            {/* Marquee título + venue */}
            <Marquee text={marqueeText} style={{ color: '#FFFFFF', fontSize: '1.3rem', lineHeight: '1.2', flexShrink: 0 }} />

            {/* Lineup */}
            <p
              className="font-meta"
              style={{ color: '#FFFFFF', fontSize: '0.6rem', opacity: 0.5, marginTop: '6px', marginBottom: '16px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {event.lineup.join(' · ')}
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', flexShrink: 0 }}>
              <button
                className="font-display"
                disabled={!hasFlyer}
                onClick={() => { if (hasFlyer && event.flyer_url) onFlyer({ url: event.flyer_url, title: event.title }) }}
                style={{
                  backgroundColor: hasFlyer ? '#F0E040' : 'transparent',
                  color:           hasFlyer ? '#000000' : '#FFFFFF',
                  border:          hasFlyer ? 'none' : '1px solid #1C1C1C',
                  fontSize:        '0.6rem',
                  padding:         '7px 14px',
                  cursor:          hasFlyer ? 'pointer' : 'default',
                  opacity:         hasFlyer ? 1 : 0.3,
                }}
              >
                VER FLYER
              </button>

              {hasWeb ? (
                <a
                  href={event.web!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display"
                  style={{ color: '#FFFFFF', fontSize: '0.6rem', padding: '7px 14px', border: '1px solid #FFFFFF', textDecoration: 'none' }}
                >
                  WEB →
                </a>
              ) : (
                <span
                  className="font-display"
                  style={{ color: '#FFFFFF', fontSize: '0.6rem', padding: '7px 14px', border: '1px solid #1C1C1C', opacity: 0.3 }}
                >
                  WEB →
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────────

interface HeroProps {
  releases: Release[]
}

export default function Hero({ releases }: HeroProps) {
  const [tab,       setTab]       = useState<HeroTab>('top')
  const [selected,  setSelected]  = useState<Release | null>(null)
  const [track,     setTrack]     = useState<PlayerTrack | null>(null)
  const [clipIndex, setClipIndex] = useState(1)
  const [flyer,     setFlyer]     = useState<{ url: string; title: string } | null>(null)

  const topReleases = [...releases].sort((a, b) => b.price - a.price).slice(0, 6)

  const handlePlay = (t: PlayerTrack, clip: number) => { setTrack(t); setClipIndex(clip) }

  const mixLabel = getMixLabel()

  const TABS: { id: HeroTab; label: string }[] = [
    { id: 'top',    label: 'TOP'     },
    { id: 'mix',    label: mixLabel  },
    { id: 'events', label: 'EVENTOS' },
  ]

  const marqueeText =
    tab === 'top'
      ? topReleases.map(r => `${r.artists[0]} — ${r.title}`).join(' · ')
      : tab === 'mix'
      ? MIX.tracklist
      : MOCK_EVENTS.map(e => `${e.date} · ${e.title}`).join(' — ')

  return (
    <>
      {/* ── Barra: tabs izquierda + marquee derecha ── */}
      <div
        className="flex items-stretch"
        style={{ borderBottom: '2px solid #FFFFFF', borderTop: '2px solid #FFFFFF' }}
      >
        {/* Tabs */}
        <div className="flex" style={{ flexShrink: 0 }}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="font-display text-xs"
              style={{
                backgroundColor: tab === t.id ? '#F0E040' : '#000000',
                color:           tab === t.id ? '#000000' : '#FFFFFF',
                borderRight:     '2px solid #FFFFFF',
                padding:         '14px 20px',
                cursor:          'pointer',
                transition:      'background-color 0.15s, color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Marquee */}
        <div className="flex items-center flex-1" style={{ minWidth: 0, paddingLeft: '12px' }}>
          <Marquee text={marqueeText} style={{ color: '#F0E040', fontSize: '1.3rem', lineHeight: '1.1' }} />
        </div>
      </div>

      {/* ── Contenido del tab ── */}
      <div style={{ borderBottom: '2px solid #FFFFFF' }}>
        {tab === 'top'    && <TopContent releases={topReleases} onSelect={setSelected} onPlay={handlePlay} />}
        {tab === 'mix'    && <MixContent />}
        {tab === 'events' && <EventsContent onFlyer={setFlyer} />}
      </div>

      {/* Modales */}
      {selected && (
        <RecordModal
          release={selected}
          releases={releases}
          onClose={() => setSelected(null)}
          onPlay={handlePlay}
          onSelect={setSelected}
        />
      )}
      {flyer  && <FlyerModal src={flyer.url} title={flyer.title} onClose={() => setFlyer(null)} />}
      {track  && <FloatingPlayer track={track} clipIndex={clipIndex} onClose={() => setTrack(null)} />}
    </>
  )
}
