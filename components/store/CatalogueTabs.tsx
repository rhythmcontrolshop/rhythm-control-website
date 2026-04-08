'use client'
// components/store/CatalogueTabs.tsx
// Tabs de género. Línea superior 2px white, underline amarillo en activo.

interface CatalogueTabsProps {
  genres:   string[]
  active:   string | null
  onChange: (genre: string | null) => void
}

export default function CatalogueTabs({ genres, active, onChange }: CatalogueTabsProps) {
  const tabs = [
    { key: null, label: 'TODO' },
    ...genres.map(g => ({ key: g, label: g.toUpperCase() }))
  ]

  return (
    <div style={{ borderTop: 'var(--rc-border-main)' }}>
      <div className="flex items-stretch overflow-x-auto">
        {tabs.map(({ key, label }) => {
          const isActive = key === active
          return (
            <button
              key={label}
              onClick={() => onChange(key)}
              className="font-display text-xs px-5 py-4 transition-colors whitespace-nowrap"
              style={{
                color: isActive ? 'var(--rc-color-accent)' : 'var(--rc-color-text)',
                borderBottom: isActive ? 'var(--rc-border-accent)' : '2px solid transparent',
                marginBottom: '-2px',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
