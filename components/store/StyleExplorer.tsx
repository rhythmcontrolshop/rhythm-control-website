'use client'
// components/store/StyleExplorer.tsx
// Sección para explorar discos por estilo musical.

import { useState, useEffect } from 'react'
import type { Release } from '@/types'

interface StyleExplorerProps {
  releases: Release[]
  onSelectStyle: (style: string) => void
}

interface StyleCount {
  name: string
  count: number
}

export default function StyleExplorer({ releases, onSelectStyle }: StyleExplorerProps) {
  const [styles, setStyles] = useState<StyleCount[]>([])

  useEffect(() => {
    // Contar discos por estilo
    const styleMap = new Map<string, number>()
    
    releases.forEach(release => {
      release.styles?.forEach(style => {
        styleMap.set(style, (styleMap.get(style) || 0) + 1)
      })
    })

    // Convertir a array y ordenar por count
    const styleArray = Array.from(styleMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Máximo 8 estilos

    setStyles(styleArray)
  }, [releases])

  if (styles.length === 0) return null

  return (
    <div
      className="mt-8 mb-8 px-4 md:px-6"
      style={{ borderTop: '2px solid #FFFFFF' }}
    >
      {/* Título */}
      <div className="py-6">
        <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>
          EXPLORAR POR ESTILO
        </p>
      </div>

      {/* Grid de estilos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {styles.map(style => (
          <button
            key={style.name}
            className="flex flex-col items-start p-4 transition-colors"
            style={{
              backgroundColor: '#000000',
              border: '1px solid #1C1C1C',
            }}
            onClick={() => onSelectStyle(style.name)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F0E040'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1C1C1C'
            }}
          >
            <p className="font-display text-sm text-left" style={{ color: '#FFFFFF' }}>
              {style.name.toUpperCase()}
            </p>
            <p className="font-meta text-xs mt-1" style={{ color: '#FFFFFF' }}>
              {style.count} {style.count === 1 ? 'disco' : 'discos'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
