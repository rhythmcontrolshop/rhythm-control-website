'use client'
// components/store/FavoriteButton.tsx
// Corazón: posicionado encima del texto/botón en cards (NO en la esquina superior).
// Solo perfilado blanco, se pone amarillo en hover/active (magenta en tema magenta).
// Sin fondo gris semi-transparente.

import { useState, useEffect } from 'react'
import { useLocale } from '@/context/LocaleContext'

interface FavoriteButtonProps {
  releaseId: string
  discogsReleaseId?: number
  initialFavorited?: boolean
  size?: number
  variant?: 'card' | 'modal'
  theme?: 'default' | 'magenta' | 'green'
}

export default function FavoriteButton({
  releaseId,
  discogsReleaseId,
  initialFavorited = false,
  size = 18,
  variant = 'card',
  theme = 'default',
}: FavoriteButtonProps) {
  const { t } = useLocale()
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(initialFavorited)
  const [hovering, setHovering] = useState(false)

  const accentColor = theme === 'magenta' ? '#FF00FF' : theme === 'green' ? '#77DD77' : '#F0E040'

  useEffect(() => {
    if (initialFavorited) return
    async function check() {
      try {
        const res = await fetch('/api/cuenta/favoritos')
        if (res.ok) {
          const data = await res.json()
          if (discogsReleaseId) {
            const isFav = data.favorites?.some((f: any) => f.discogs_release_id === discogsReleaseId)
            setFavorited(!!isFav)
          }
        }
      } catch { /* silencioso */ }
      setChecked(true)
    }
    check()
  }, [discogsReleaseId, initialFavorited])

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      if (favorited) {
        const res = await fetch('/api/cuenta/favoritos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ release_id: releaseId }),
        })
        if (res.ok) setFavorited(false)
      } else {
        const res = await fetch('/api/cuenta/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ release_id: releaseId }),
        })
        if (res.ok) setFavorited(true)
      }
    } catch { /* silencioso */ }
    setLoading(false)
  }

  // Determine visual state
  const fillColor = favorited ? accentColor : (hovering ? accentColor : 'none')
  const strokeColor = favorited ? accentColor : (hovering ? accentColor : '#FFFFFF')

  const heartSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'fill 0.15s ease, stroke 0.15s ease, transform 0.15s ease',
        transform: loading ? 'scale(0.85)' : favorited ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )

  if (variant === 'card') {
    return (
      <button
        onClick={toggle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="absolute left-0 z-30 transition-opacity"
        style={{
          opacity: !checked ? 0 : 1,
          transition: 'opacity 0.2s ease',
          cursor: 'pointer',
          padding: '2px',
          // Position just above the buttons row
          top: '-22px',
        }}
        aria-label={favorited ? t('btn.inFavorites') : t('btn.favorite')}
      >
        {heartSvg}
      </button>
    )
  }

  // Modal variant: inline button
  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="flex items-center gap-2 font-display text-xs px-4 py-2 transition-colors hover:opacity-80 shrink-0"
      style={{
        border: favorited ? `2px solid ${accentColor}` : '2px solid #FFFFFF',
        color: favorited ? accentColor : '#FFFFFF',
        backgroundColor: favorited ? `${accentColor}1a` : 'transparent',
        cursor: 'pointer',
      }}
      aria-label={favorited ? t('btn.inFavorites') : t('btn.favorite')}
    >
      {heartSvg}
      {favorited ? t('btn.inFavorites') : t('btn.favorite')}
    </button>
  )
}
