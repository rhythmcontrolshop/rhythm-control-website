'use client'
// components/store/CatalogueTabs.tsx
// Tabs de género. Activo en amarillo. border-top y border-bottom 2px white.

interface CatalogueTabsProps {
  genres:   string[]
  active:   string | null
  onChange: (genre: string | null) => void
}

export default function CatalogueTabs({ genres, active, onChange }: CatalogueTabsProps) {
  const tabs = [{ key: null, label: 'TODO' }, ...genres.map(g => ({ key: g, label: g.toUpperCase() }))]

  return (
    <div
      className="overflow-x-auto"
      style={{
        borderTop:    'var(--rc-border-main)',
        borderBottom: 'var(--rc-border-main)',
      }}
    >
      <div className="flex items-stretch min-w-max">
        {tabs.map(({ key, label }) => {
          const isActive = key === active
          return (
            <button
              key={label}
              onClick={() => onChange(key)}
              className="font-display text-xs px-5 py-4 transition-colors whitespace-nowrap"
              style={{
                color:        isActive ? 'var(--rc-color-accent)' : 'var(--rc-color-muted)',
                borderBottom: isActive ? 'var(--rc-border-accent)' : '2px solid transparent',
                marginBottom: '-2px', // compensa el border-bottom del contenedor
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
