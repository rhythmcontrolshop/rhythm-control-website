'use client'
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import RecordCard     from '@/components/store/RecordCard'
import RecordModal    from '@/components/store/RecordModal'
import FloatingPlayer from '@/components/store/FloatingPlayer'
import type { Release, PlayerTrack } from '@/types'
import { Marquee }           from '@/components/ui/Marquee'
import { FlyerPlaceholder }  from '@/components/ui/FlyerPlaceholder'

type HeroTab = 'top' | 'mix' | 'events'

const BADGES = ['STAFF PICK', 'NEW!', 'ON HYPE'] as const
const MOCK_EVENTS = [
  { id: 'e1', date: '2026-04-18', type: 'DJ SET', title: 'RHYTHM CONTROL × MOOG', venue: 'Moog Club', lineup: ['Selector'], flyer_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=900&fit=crop' as string | null, web: null },
  { id: 'e2', date: '2026-04-25', type: 'SESIÓN', title: 'DEEP FACTORY VOL.12', venue: 'Sala Apolo', lineup: ['Larry Deep'], flyer_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=900&fit=crop' as string | null, web: null },
  { id: 'e3', date: '2026-05-03', type: 'ALL NIGHT', title: 'TECHNO MARATHON', venue: 'Nitsa Club', lineup: ['Surgeon'], flyer_url: null as string | null, web: null },
]
const MIX = {
  date: '2026-04-01', embed: 'https://www.mixcloud.com/widget/iframe/?hide_cover=0&mini=0&autoplay=0&feed=%2Fmaxvibes%2Fthe-cat-walk-040426-totally-wired-radio%2F', dj: 'RC SELECTOR', origin: 'Barcelona',
  dj_image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=440&fit=crop',
  bio: 'Residente en {{Rhythm Control}}. Especialista en {{deep house}} y {{techno}}.',
  mixcloud: 'https://www.mixcloud.com/rhythmcontrolshop/' as string | null, tracklist: 'Strings of Life · Move Your Body',
}

// FIX: Usar getUTCMonth() para evitar errores de hidratación por zona horaria
function getMixLabel() { 
  const d = new Date(MIX.date); 
  const mes = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][d.getUTCMonth()]; 
  return `MIX ${mes} ${String(d.getUTCFullYear()).slice(2)}` 
}

function FlyerModal({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const bgRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' } }, [onClose])
  return (
    <div ref={bgRef} className="fixed inset-0 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 300 }} onClick={e => { if (e.target === bgRef.current) onClose() }}>
      <div className="relative overflow-hidden" style={{ border: '2px solid #FFFFFF', backgroundColor: '#000000', maxHeight: '90vh' }}>
        <button onClick={onClose} className="absolute top-3 right-3 font-display text-xs z-10 hover:opacity-60" style={{ color: '#FFFFFF' }}>✕</button>
        <div style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
          <Image src={src} alt={title} width={800} height={1200} style={{ width: 'auto', height: 'auto', maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block' }} unoptimized />
        </div>
        <div className="p-4" style={{ borderTop: '1px solid #1C1C1C' }}>
          <p className="font-display" style={{ color: '#FFFFFF', fontSize: '0.85rem' }}>{title}</p>
        </div>
      </div>
    </div>
  )
}

function TopContent({ releases, onSelect, onPlay }: { releases: Release[]; onSelect: (r: Release) => void; onPlay: (t: PlayerTrack, clip: number) => void }) {
  if (releases.length === 0) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-[2px]" style={{ backgroundColor: '#FFFFFF' }}>
      {releases.map((release, i) => (
        <div key={release.discogs_listing_id} className="relative bg-black">
          <span className="font-display" style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: '#F0E040', color: '#000000', fontSize: '0.5rem', padding: '2px 6px', zIndex: 10 }}>{BADGES[i % BADGES.length]}</span>
          <RecordCard release={release} onSelect={onSelect} onPlay={onPlay} />
        </div>
      ))}
    </div>
  )
}

function parseBio(text: string): React.ReactNode[] { return text.split(/(\{\{[^}]+\}\})/g).map((part, i) => { const match = part.match(/^\{\{(.+)\}\}$/); return match ? <span key={i} style={{ color: '#F0E040' }}>{match[1]}</span> : <span key={i}>{part}</span> }) }

function MixContent({ onImage }: { onImage: (f: { url: string; title: string }) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-[2px]" style={{ minHeight: '300px', backgroundColor: '#1C1C1C' }}>
      <div className="hidden md:block relative overflow-hidden group bg-black" style={{ cursor: MIX.dj_image ? 'pointer' : 'default' }} onClick={() => { if (MIX.dj_image) onImage({ url: MIX.dj_image, title: MIX.dj }) }}>
        {MIX.dj_image ? (<><Image src={MIX.dj_image} alt={MIX.dj} fill style={{ objectFit: 'cover', objectPosition: 'top' }} sizes="200px" unoptimized /></>) : (<FlyerPlaceholder title={MIX.dj} date={getMixLabel()} code="RC-MIX" />)}
      </div>
      <div className="col-span-1 md:col-span-2 flex flex-col bg-black" style={{ borderLeft: '2px solid #FFFFFF' }}>
        <div style={{ padding: '16px', flexShrink: 0 }}><Marquee text={MIX.dj} style={{ color: '#F0E040', fontSize: '1.3rem', lineHeight: '1.2' }} /></div>
        <div style={{ flex: 1, padding: '10px 16px' }}><p className="font-meta font-bold" style={{ color: '#FFFFFF', fontSize: '0.68rem', lineHeight: 1.8 }}>{parseBio(MIX.bio)}</p></div>
        <div className="flex gap-3" style={{ padding: '12px 16px', borderTop: '1px solid #1C1C1C' }}>
          {MIX.mixcloud && <a href={MIX.mixcloud} target="_blank" rel="noopener noreferrer" className="font-display" style={{ color: '#000000', backgroundColor: '#F0E040', fontSize: '0.6rem', padding: '7px 14px', textDecoration: 'none' }}>MIXCLOUD →</a>}
        </div>
      </div>
      <div className="col-span-1 md:col-span-3 overflow-hidden bg-black" style={{ minHeight: '300px' }}><iframe title={getMixLabel()} src={MIX.embed} width="100%" height="100%" style={{ border: 'none', minHeight: '300px' }} allow="autoplay" /></div>
    </div>
  )
}

// FIX: Usar getUTCDay() y getUTCDate()
const DIAS = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']; const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
function formatEventDate(iso: string) { const d = new Date(iso + 'T12:00:00Z'); return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}` }

function EventsContent({ onFlyer }: { onFlyer: (f: { url: string; title: string }) => void }) {
  const n = MOCK_EVENTS.length; const textDesktopClass = n === 1 ? 'md:col-span-3' : n === 2 ? 'md:col-span-2' : 'md:col-span-1'; const imageDesktopClass = n === 1 ? 'md:col-span-3' : 'md:col-span-1'
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-[2px]" style={{ minHeight: '220px', backgroundColor: '#1C1C1C' }}>
      {MOCK_EVENTS.flatMap((event) => {
        const hasFlyer = Boolean(event.flyer_url)
        return [
          <div key={`${event.id}-text`} className={`col-span-1 ${textDesktopClass} flex flex-col bg-black`} style={{ borderLeft: '2px solid #FFFFFF', padding: '16px' }}>
             <span className="font-display" style={{ color: '#F0E040', fontSize: '0.65rem' }}>{formatEventDate(event.date)}</span>
             <Marquee text={event.title} style={{ color: '#FFFFFF', fontSize: '1.3rem', marginTop: '4px' }} />
             <button onClick={() => { if (hasFlyer && event.flyer_url) onFlyer({ url: event.flyer_url, title: event.title }) }} style={{ marginTop: 'auto', backgroundColor: '#F0E040', color: '#000000', fontSize: '0.6rem', padding: '7px 14px', width: 'fit-content' }} className="font-display">VER FLYER</button>
          </div>,
          <div key={`${event.id}-img`} className={`col-span-1 ${imageDesktopClass} relative overflow-hidden bg-black`} style={{ minHeight: '220px' }} onClick={() => { if (hasFlyer && event.flyer_url) onFlyer({ url: event.flyer_url, title: event.title }) }}>
            {hasFlyer ? <Image src={event.flyer_url!} alt={event.title} fill style={{ objectFit: 'cover' }} sizes="300px" unoptimized /> : <FlyerPlaceholder title={event.title} date={formatEventDate(event.date)} type={event.type} code={event.id} />}
          </div>,
        ]
      })}
    </div>
  )
}

interface HeroProps { releases: Release[] }
export default function Hero({ releases }: HeroProps) {
  const [tab, setTab] = useState<HeroTab>('top')
  const [selected, setSelected] = useState<Release | null>(null)
  const [track, setTrack] = useState<PlayerTrack | null>(null)
  const [clipIndex, setClipIndex] = useState(1)
  const [flyer, setFlyer] = useState<{ url: string; title: string } | null>(null)

  const topReleases = [...releases].sort((a, b) => b.price - a.price).slice(0, 6)
  const handlePlay = (t: PlayerTrack, clip: number) => { setTrack(t); setClipIndex(clip) }
  const mixLabel = getMixLabel()
  const TABS: { id: HeroTab; label: string }[] = [ { id: 'top', label: 'TOP' }, { id: 'mix', label: mixLabel }, { id: 'events', label: 'AGENDA' } ]
  const marqueeText = tab === 'top' ? topReleases.map(r => `${r.artists[0]} — ${r.title}`).join(' · ') : tab === 'mix' ? MIX.tracklist : MOCK_EVENTS.map(e => `${e.date} · ${e.title}`).join(' — ')

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-6" style={{ borderBottom: '2px solid #FFFFFF' }}>
        <div className="col-span-2 md:col-span-3 grid grid-cols-2 md:grid-cols-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="font-display text-xs" style={{ backgroundColor: tab === t.id ? '#F0E040' : '#000000', color: tab === t.id ? '#000000' : '#FFFFFF', borderRight: '2px solid #FFFFFF', borderBottom: '2px solid #FFFFFF', padding: '14px 20px', cursor: 'pointer', transition: 'background-color 0.15s, color 0.15s' }}
              onMouseEnter={(e) => { if(tab !== t.id) { e.currentTarget.style.backgroundColor = '#F0E040'; e.currentTarget.style.color = '#000000'; } }} onMouseLeave={(e) => { if(tab !== t.id) { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#FFFFFF'; } }}>{t.label}</button>
          ))}
        </div>
        <div className="hidden md:flex col-span-3 items-center" style={{ paddingLeft: '12px', backgroundColor: '#000000' }}>
          <Marquee text={marqueeText} style={{ color: '#F0E040', fontSize: '1.3rem', lineHeight: '1.1' }} />
        </div>
      </div>
      <div style={{ borderBottom: '2px solid #FFFFFF' }}>
        {tab === 'top' && <TopContent releases={topReleases} onSelect={setSelected} onPlay={handlePlay} />}
        {tab === 'mix' && <MixContent onImage={setFlyer} />}
        {tab === 'events' && <EventsContent onFlyer={setFlyer} />}
      </div>
      {selected && <RecordModal release={selected} releases={releases} onClose={() => setSelected(null)} onPlay={handlePlay} onSelect={setSelected} />}
      {flyer && <FlyerModal src={flyer.url} title={flyer.title} onClose={() => setFlyer(null)} />}
      {track && <FloatingPlayer track={track} clipIndex={clipIndex} onClose={() => setTrack(null)} />}
    </>
  )
}
