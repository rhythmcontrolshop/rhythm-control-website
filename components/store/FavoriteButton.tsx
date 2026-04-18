'use client'
// components/store/FavoriteButton.tsx
// E4-3: Usa FavoritesContext para evitar N+1 API calls.
// Si el contexto está disponible (páginas con grid), lo usa.
// Si no (página individual), hace fetch propio como fallback.

import { useState } from 'react'
import { useLocale } from '@/context/LocaleContext'
import { useFavorites } from '@/context/FavoritesContext'

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
  const favCtx = useFavorites()

  // Si hay contexto, usar su estado (batch). Si no, estado local + fetch propio.
  const isFavoritedFromCtx = favCtx && discogsReleaseId
    ? favCtx.favorites.has(discogsReleaseId)
    : null  // null = no hay contexto, usar local

  const [localFavorited, setLocalFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [hovering, setHovering] = useState(false)

  const favorited = isFavoritedFromCtx !== null ? isFavoritedFromCtx : localFavorited
  const accentColor = theme === 'magenta' ? '#FF00FF' : theme === 'green' ? '#77DD77' : '#F0E040'

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (loading) return

    // Si hay contexto, delegar al batch toggle
    if (favCtx && discogsReleaseId) {
      setLoading(true)
      const result = await favCtx.toggle(releaseId, discogsReleaseId, favorited)
      // El contexto ya actualizó favorites Set, así que re-renderiza automáticamente
      setLoading(false)
      return
    }

    // Fallback sin contexto: fetch propio
    setLoading(true)
    try {
      if (favorited) {
        const res = await fetch('/api/cuenta/favoritos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ release_id: releaseId }),
        })
        if (res.ok) setLocalFavorited(false)
      } else {
        const res = await fetch('/api/cuenta/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ release_id: releaseId }),
        })
        if (res.ok) setLocalFavorited(true)
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
          opacity: favCtx && !favCtx.loaded ? 0 : 1,
          transition: 'opacity 0.2s ease',
          cursor: 'pointer',
          padding: '2px',
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
    </button>
  )
}
