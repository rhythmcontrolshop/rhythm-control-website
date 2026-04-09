'use client'
// components/home/Hero.tsx
// Hero de 200px: tres tabs (Top Sellers, Mix del Mes, Eventos) + marquee.

import { useState } from 'react'
import Image from 'next/image'
import RecordCard     from '@/components/store/RecordCard'
import RecordModal    from '@/components/store/RecordModal'
import FloatingPlayer from '@/components/store/FloatingPlayer'
import type { Release, PlayerTrack } from '@/types'

type HeroTab = 'sellers' | 'mix' | 'events'

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_EVENTS = [
  {
    id:      'e1',
    date:    'ABR 18',
    type:    'DJ SET',
    title:   'RHYTHM CONTROL × MOOG',
    venue:   'Moog Club',
    city:    'Barcelona',
    lineup:  ['Selector', 'Guest DJ'],
    flyer_url: null as string | null,
    web:       null as string | null,
  },
  {
    id:      'e2',
    date:    'ABR 25',
    type:    'SESIÓN',
    title:   'DEEP FACTORY VOL.12',
    venue:   'Sala Apolo',
    city:    'Barcelona',
    lineup:  ['Larry Deep', 'Marta S.', 'Xavi R.'],
    flyer_url: null as string | null,
    web:       null as string | null,
  },
  {
    id:      'e3',
    date:    'MAY 03',
    type:    'ALL NIGHT',
    title:   'TECHNO MARATHON',
    venue:   'Nitsa Club',
    city:    'Barcelona',
    lineup:  ['Surgeon', 'Paula Temple'],
    flyer_url: null as string | null,
    web:       null as string | null,
  },
]

const MIX = {
  date:      '2026-04-01',   // fecha de publicación — determina el label del tab
  embed:     'https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=0&feed=%2Frhythmcontrolshop%2F',
  dj:        'RC SELECTOR',
  origin:    'Barcelona',
  dj_image:  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=440&fit=crop',
  bio:       'Residente en Rhythm Control. Especialista en house, techno y jazz electrónico. Seleccionando desde 2015.',
  web:       null as string | null,
  instagram: null as string | null,
  mixcloud:  'https://www.mixcloud.com/rhythmcontrolshop/',
  tracklist: 'Strings of Life · Move Your Body · Pacific State · I Feel Love · Da Funk · Can You Feel It · Promised Land · Supernature · So What · Mystery of Love',
}

function getMixTabLabel() {
  const d   = new Date(MIX.date)
  const MES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][d.getMonth()]
  const YR  = String(d.getFullYear()).slice(2)
  return `MIX DEL MES ${MES} ${YR}`
}

// ── TopSellersContent ──────────────────────────────────────────────────────────

function TopSellersContent({
  releases,
  onSelect,
  onPlay,
}: {
  releases: Release[]
  onSelect: (r: Release) => void
  onPlay:   (t: PlayerTrack, clip: number) => void
}) {
  return (
    <div
      style={{
        display:    'flex',
        gap:        '1px',
        padding:    '4px',
        height:     '100%',
        overflowX:  'auto',
        overflowY:  'hidden',
        alignItems: 'stretch',
      }}
    >
      {releases.map(release => (
        <div
          key={release.discogs_listing_id}
          style={{ width: '150px', flexShrink: 0 }}
        >
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
    <div style={{ display: 'flex', height: '100%' }}>

      {/* Imagen DJ — ratio ~1.1:1 */}
      <div
        style={{
          width:       '140px',
          flexShrink:  0,
          position:    'relative',
          borderRight: '1px solid #1C1C1C',
          overflow:    'hidden',
        }}
      >
        <Image
          src={MIX.dj_image}
          alt={MIX.dj}
          fill
          style={{ objectFit: 'cover', objectPosition: 'top' }}
          sizes="140px"
        />
      </div>

      {/* Embed Mixcloud */}
      <div style={{ flex: 1, overflow: 'hidden', borderRight: '1px solid #1C1C1C' }}>
        <iframe
          title={getMixTabLabel()}
          src={MIX.embed}
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block', backgroundColor: '#000' }}
          allow="autoplay"
        />
      </div>

      {/* Columna info: marquee nombre + bio + links */}
      <div
        style={{
          width:         '200px',
          flexShrink:    0,
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
        }}
      >
        {/* Marquee DJ — mismo tamaño que nombres en grid */}
        <div
          className="marquee"
          style={{
            height:       '42px',
            borderBottom: '1px solid #1C1C1C',
            display:      'flex',
            alignItems:   'center',
            flexShrink:   0,
            paddingLeft:  '10px',
          }}
        >
          <span
            className="marquee-content font-display"
            style={{ color: '#FFFFFF', fontSize: '1.3rem', lineHeight: '1.1' }}
          >
            {djMarquee}&nbsp;&nbsp;&nbsp;&nbsp;{djMarquee}&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>

        {/* Bio + links */}
        <div
          style={{
            flex:           1,
            padding:        '10px 12px',
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'space-between',
            overflow:       'hidden',
          }}
        >
          <p
            className="font-meta"
            style={{ color: '#FFFFFF', fontSize: '0.6rem', opacity: 0.6, lineHeight: 1.5 }}
          >
            {MIX.bio}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {MIX.web && (
              <a href={MIX.web} target="_blank" rel="noopener noreferrer"
                className="font-display"
                style={{ color: '#F0E040', fontSize: '0.62rem', textDecoration: 'none' }}
              >WEB</a>
            )}
            {MIX.instagram && (
              <a href={MIX.instagram} target="_blank" rel="noopener noreferrer"
                className="font-display"
                style={{ color: '#F0E040', fontSize: '0.62rem', textDecoration: 'none' }}
              >INSTAGRAM</a>
            )}
            {MIX.mixcloud && (
              <a href={MIX.mixcloud} target="_blank" rel="noopener noreferrer"
                className="font-display"
                style={{ color: '#F0E040', fontSize: '0.62rem', textDecoration: 'none' }}
              >MIXCLOUD →</a>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

// ── EventsContent ──────────────────────────────────────────────────────────────

function EventsContent() {
  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        height:              '100%',
      }}
    >
      {MOCK_EVENTS.map((event, i) => {
        const marqueeText = `${event.title} — ${event.venue}, ${event.city}`
        const hasFlyer    = Boolean(event.flyer_url)
        const hasWeb      = Boolean(event.web)

        return (
          <div
            key={event.id}
            style={{
              display:       'flex',
              flexDirection: 'column',
              borderRight:   i < MOCK_EVENTS.length - 1 ? '1px solid #1C1C1C' : 'none',
              overflow:      'hidden',
              padding:       '8px 10px 6px',
            }}
          >
            {/* Fecha + tipo */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0, marginBottom: '2px' }}>
              <span className="font-display" style={{ color: '#F0E040', fontSize: '0.65rem' }}>
                {event.date}
              </span>
              <span className="font-meta" style={{ color: '#FFFFFF', fontSize: '0.55rem', opacity: 0.45 }}>
                {event.type}
              </span>
            </div>

            {/* Marquee: título + venue */}
            <div className="marquee" style={{ flexShrink: 0, overflow: 'hidden' }}>
              <span
                className="marquee-content font-display"
                style={{ color: '#FFFFFF', fontSize: '1.3rem', lineHeight: '1.15', whiteSpace: 'nowrap' }}
              >
                {marqueeText}&nbsp;&nbsp;&nbsp;&nbsp;{marqueeText}&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            </div>

            {/* Lineup */}
            <p
              className="font-meta"
              style={{
                color:        '#FFFFFF',
                fontSize:     '0.58rem',
                opacity:      0.45,
                marginTop:    '4px',
                flexShrink:   0,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}
            >
              {event.lineup.join(' · ')}
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '6px', flexShrink: 0 }}>
              <button
                className="font-display"
                disabled={!hasFlyer}
                style={{
                  backgroundColor: hasFlyer ? '#F0E040' : 'transparent',
                  color:           hasFlyer ? '#000000' : '#FFFFFF',
                  border:          hasFlyer ? 'none' : '1px solid #1C1C1C',
                  fontSize:        '0.58rem',
                  padding:         '3px 7px',
                  cursor:          hasFlyer ? 'pointer' : 'default',
                  opacity:         hasFlyer ? 1 : 0.35,
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
                  style={{
                    color:          '#FFFFFF',
                    fontSize:       '0.58rem',
                    padding:        '3px 7px',
                    border:         '1px solid #FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  WEB →
                </a>
              ) : (
                <span
                  className="font-display"
                  style={{
                    color:   '#FFFFFF',
                    fontSize: '0.58rem',
                    padding: '3px 7px',
                    border:  '1px solid #1C1C1C',
                    opacity: 0.35,
                  }}
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
  const [tab,       setTab]       = useState<HeroTab>('sellers')
  const [selected,  setSelected]  = useState<Release | null>(null)
  const [track,     setTrack]     = useState<PlayerTrack | null>(null)
  const [clipIndex, setClipIndex] = useState(1)

  const topSellers = [...releases].sort((a, b) => b.price - a.price).slice(0, 8)

  const handlePlay = (t: PlayerTrack, clip: number) => {
    setTrack(t)
    setClipIndex(clip)
  }

  const mixLabel = getMixTabLabel()

  const TABS: { id: HeroTab; label: string }[] = [
    { id: 'sellers', label: 'TOP SELLERS' },
    { id: 'mix',     label: mixLabel      },
    { id: 'events',  label: 'EVENTOS'     },
  ]

  // Marquee exterior cambia según tab activo
  const marqueeText =
    tab === 'sellers'
      ? topSellers.map(r => `${r.artists[0]} — ${r.title}`).join(' · ')
      : tab === 'mix'
      ? MIX.tracklist
      : MOCK_EVENTS.map(e => `${e.date} · ${e.title} · ${e.venue}`).join(' — ')

  return (
    <>
      <div
        style={{
          height:          '200px',
          borderBottom:    '2px solid #FFFFFF',
          display:         'flex',
          overflow:        'hidden',
          backgroundColor: '#000000',
        }}
      >
        {/* LEFT: marquee + contenido */}
        <div
          style={{
            flex:          1,
            overflow:      'hidden',
            display:       'flex',
            flexDirection: 'column',
            minWidth:      0,
          }}
        >
          {/* Marquee exterior — mismo tamaño que nombres en grid (1.3rem) */}
          <div
            className="marquee"
            style={{
              height:          '42px',
              borderBottom:    '1px solid #1C1C1C',
              display:         'flex',
              alignItems:      'center',
              backgroundColor: '#000000',
              flexShrink:      0,
              paddingLeft:     '8px',
            }}
          >
            <span
              className="marquee-content font-display"
              style={{ color: '#F0E040', fontSize: '1.3rem', lineHeight: '1.1' }}
            >
              {marqueeText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{marqueeText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>

          {/* Contenido del tab activo */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {tab === 'sellers' && (
              <TopSellersContent
                releases={topSellers}
                onSelect={setSelected}
                onPlay={handlePlay}
              />
            )}
            {tab === 'mix'    && <MixContent />}
            {tab === 'events' && <EventsContent />}
          </div>
        </div>

        {/* RIGHT: tabs — texto horizontal bold */}
        <div
          style={{
            borderLeft:    '1px solid #1C1C1C',
            display:       'flex',
            flexDirection: 'column',
            flexShrink:    0,
            width:         '140px',
          }}
        >
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex:            1,
                borderBottom:    i < TABS.length - 1 ? '1px solid #1C1C1C' : 'none',
                borderTop:       'none',
                borderLeft:      'none',
                borderRight:     'none',
                backgroundColor: tab === t.id ? '#F0E040' : '#000000',
                color:           tab === t.id ? '#000000' : '#FFFFFF',
                cursor:          'pointer',
                transition:      'background-color 0.15s, color 0.15s',
                fontFamily:      'var(--rc-font-display)',
                fontWeight:      700,
                fontSize:        '0.65rem',
                letterSpacing:   '0.04em',
                textTransform:   'uppercase',
                textAlign:       'left',
                padding:         '0 12px',
                lineHeight:      1.35,
              }}
              onMouseEnter={e => {
                if (tab !== t.id) e.currentTarget.style.backgroundColor = '#1C1C1C'
              }}
              onMouseLeave={e => {
                if (tab !== t.id) e.currentTarget.style.backgroundColor = '#000000'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal abierto desde Top Sellers */}
      {selected && (
        <RecordModal
          release={selected}
          releases={releases}
          onClose={() => setSelected(null)}
          onPlay={handlePlay}
          onSelect={setSelected}
        />
      )}

      {/* Player del Hero */}
      {track && (
        <FloatingPlayer
          track={track}
          clipIndex={clipIndex}
          onClose={() => setTrack(null)}
        />
      )}
    </>
  )
}
