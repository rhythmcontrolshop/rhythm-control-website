'use client'
import { useState, useEffect, useRef } from 'react'

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'year' | 'artist'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'MÁS NUEVOS' },
  { value: 'price_asc',  label: 'PRECIO ↑'   },
  { value: 'price_desc', label: 'PRECIO ↓'   },
  { value: 'year',       label: 'AÑO'        },
  { value: 'artist',     label: 'ARTISTA A–Z' },
]

interface CatalogueTabsProps {
  styles:        string[]
  activeStyle:   string | null
  onStyleChange: (s: string | null) => void
  labels:        string[]
  activeLabel:   string | null
  onLabelChange: (l: string | null) => void
  sort:          SortOption
  onSortChange:  (s: SortOption) => void
}

export default function CatalogueTabs({
  styles, activeStyle, onStyleChange,
  labels, activeLabel, onLabelChange,
  sort, onSortChange,
}: CatalogueTabsProps) {
  const [open, setOpen] = useState<'sort' | 'style' | 'label' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('pointerdown', onOutside)
    return () => document.removeEventListener('pointerdown', onOutside)
  }, [])

  const toggle = (name: typeof open) => setOpen(prev => prev === name ? null : name)
  const sortLabel  = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'ORDENAR'
  const styleLabel = activeStyle ?? 'ESTILO'
  const labelLabel = activeLabel ?? 'SELLO'

  return (
    <div ref={ref} className="flex" style={{ height: '48px', borderBottom: '2px solid #FFFFFF' }}>
      <Dropdown label={sortLabel} isOpen={open === 'sort'} onToggle={() => toggle('sort')} isActive={false} borderRight>
        {SORT_OPTIONS.map(opt => (
          <DropItem key={opt.value} label={opt.label} isSelected={sort === opt.value} onClick={() => { onSortChange(opt.value); setOpen(null) }} />
        ))}
      </Dropdown>
      <Dropdown label={styleLabel} isOpen={open === 'style'} onToggle={() => toggle('style')} isActive={!!activeStyle} borderRight>
        <DropItem label="TODOS" isSelected={!activeStyle} onClick={() => { onStyleChange(null); setOpen(null) }} />
        {styles.map(s => <DropItem key={s} label={s} isSelected={activeStyle === s} onClick={() => { onStyleChange(s); setOpen(null) }} />)}
      </Dropdown>
      <Dropdown label={labelLabel} isOpen={open === 'label'} onToggle={() => toggle('label')} isActive={!!activeLabel} borderRight={false}>
        <DropItem label="TODOS" isSelected={!activeLabel} onClick={() => { onLabelChange(null); setOpen(null) }} />
        {labels.map(l => <DropItem key={l} label={l} isSelected={activeLabel === l} onClick={() => { onLabelChange(l); setOpen(null) }} />)}
      </Dropdown>
    </div>
  )
}

function Dropdown({ label, isOpen, onToggle, isActive, borderRight, children }: {
  label: string; isOpen: boolean; onToggle: () => void
  isActive: boolean; borderRight: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ flex: 1, position: 'relative', height: '48px', borderRight: borderRight ? '2px solid #FFFFFF' : 'none' }}>
      <button
        onClick={onToggle}
        className="font-display text-xs w-full h-full flex items-center justify-between active:bg-[#F0E040] active:text-black"
        style={{
          color: isActive || isOpen ? '#F0E040' : '#FFFFFF',
          padding: '0 16px',
          transition: 'background-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040'; e.currentTarget.style.color = '#000000' }}
        onMouseLeave={e => { if (!isOpen && !isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#FFFFFF' } }}
      >
        <span>{label}</span>
        <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>▼</span>
      </button>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: '-2px', right: '-2px', backgroundColor: '#000000', border: '2px solid #FFFFFF', borderTop: 'none', maxHeight: '260px', overflowY: 'auto', zIndex: 50 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function DropItem({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-display text-xs block w-full text-left active:bg-[#F0E040] active:text-black"
      style={{
        color: isSelected ? '#F0E040' : '#FFFFFF',
        backgroundColor: isSelected ? 'rgba(240,224,64,0.08)' : '#000000',
        padding: '12px 16px',
        borderBottom: '1px solid #1C1C1C',
        minHeight: '44px',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040'; e.currentTarget.style.color = '#000000' }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#FFFFFF' } }}
    >
      {label}
    </button>
  )
}
