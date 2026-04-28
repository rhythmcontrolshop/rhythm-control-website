'use client'
// CatalogueTabs — Filter bar for catalogue grid
// Identidad única RC: amarillo #F0E040

import { useState, useEffect, useRef } from 'react'

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'year' | 'artist'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'MÁS NUEVOS' },
  { value: 'price_asc',  label: 'PRECIO ↑'   },
  { value: 'price_desc', label: 'PRECIO ↓'   },
  { value: 'year',       label: 'AÑO'        },
  { value: 'artist',     label: 'ARTISTA A–Z' },
]

const ACCENT = '#F0E040'

interface CatalogueTabsProps {
  styles:        string[]
  activeStyle:   string | null
  onStyleChange: (s: string | null) => void
  labels:        string[]
  activeLabel:   string | null
  onLabelChange: (l: string | null) => void
  sort:          SortOption
  onSortChange:  (s: SortOption) => void
  searchQuery?:     string
  onSearchChange?:  (q: string) => void
}

export default function CatalogueTabs({
  styles, activeStyle, onStyleChange,
  labels, activeLabel, onLabelChange,
  sort, onSortChange,
  searchQuery = '',
  onSearchChange,
}: CatalogueTabsProps) {
  const [open, setOpen] = useState<'sort' | 'style' | 'label' | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    <div ref={ref}>
      {/* Search bar row */}
      {onSearchChange && (
        <div style={{
          height: '48px',
          borderTop: '2px solid #FFFFFF',
          borderBottom: '2px solid #FFFFFF',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#000000',
          position: 'relative',
        }}>
          <span
            className="font-display text-xs"
            style={{
              color: searchQuery ? ACCENT : '#FFFFFF',
              padding: '0 12px 0 16px',
              opacity: searchQuery ? 1 : 0.5,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {searchQuery ? String.fromCharCode(10005) : String.fromCharCode(128269)}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="BUSCAR DISCO..."
            className="font-display text-xs"
            style={{
              flex: 1,
              height: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: searchQuery ? ACCENT : '#FFFFFF',
              padding: 0,
              letterSpacing: '0.05em',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => { onSearchChange(''); inputRef.current?.focus() }}
              className="font-display text-xs"
              style={{
                color: ACCENT,
                padding: '0 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                height: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.6' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              LIMPIAR
            </button>
          )}
        </div>
      )}

      {/* Filter tabs row */}
      <div className="flex" style={{ height: '48px', borderBottom: '2px solid #FFFFFF' }}>
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
        className="font-display text-xs w-full h-full flex items-center justify-between transition-colors duration-150"
        style={{
          color: (isActive || isOpen) ? ACCENT : '#FFFFFF',
          padding: '0 16px',
          backgroundColor: '#000000',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = ACCENT; e.currentTarget.style.color = '#000000' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = (isActive || isOpen) ? ACCENT : '#FFFFFF' }}
      >
        <span>{label}</span>
        <span className="flex items-center justify-center" style={{ fontSize: '0.55rem', opacity: 0.7, minWidth: '20px', minHeight: '20px' }}>▼</span>
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
      className="font-display text-xs block w-full text-left transition-colors duration-150"
      style={{
        color: isSelected ? ACCENT : '#FFFFFF',
        backgroundColor: '#000000',
        padding: '12px 16px',
        borderBottom: '1px solid #1C1C1C',
        minHeight: '44px',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = ACCENT; e.currentTarget.style.color = '#000000' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = isSelected ? ACCENT : '#FFFFFF' }}
    >
      {label}
    </button>
  )
}
