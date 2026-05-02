'use client'
// components/store/FavoriteButton.tsx
// Identidad única RC: corazón blanco perfil, amarillo #F0E040 seleccionado

import { useState } from 'react'
import { useLocale } from '@/context/LocaleContext'
import { useFavorites } from '@/context/FavoritesContext'

const ACCENT = '#F0E040'

interface FavoriteButtonProps {
  releaseId: string
  discogsReleaseId?: number
  initialFavorited?: boolean
  size?: number
  variant?: 'card' | 'modal'
}

export default function FavoriteButton({
  releaseId,
  discogsReleaseId,
  initialFavorited = false,
  size = 18,
  variant = 'card',
}: FavoriteButtonProps) {
  const { t } = useLocale()
  const favCtx = useFavorites()

  const isFavoritedFromCtx = favCtx && discogsReleaseId
    ? favCtx.favorites.has(discogsReleaseId)
    : null

  const [localFavorited, setLocalFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [hovering, setHovering] = useState(false)

  const favorited = isFavoritedFromCtx !== null ? isFavoritedFromCtx : localFavorited

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (loading) return

    if (favCtx && discogsReleaseId) {
      setLoading(true)
      await favCtx.toggle(releaseId, discogsReleaseId, favorited)
      setLoading(false)
      return
    }

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

  // Perfil blanco, seleccionado todo amarillo
  const fillColor = favorited ? ACCENT : (hovering ? ACCENT : 'none')
  const strokeColor = favorited ? ACCENT : (hovering ? ACCENT : '#FFFFFF')

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
        className="relative z-10 shrink-0"
        style={{
          opacity: favCtx && !favCtx.loaded ? 0 : 1,
          transition: 'opacity 0.2s ease',
          cursor: 'pointer',
          padding: '2px',
          lineHeight: 0,
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
        border: favorited ? `2px solid ${ACCENT}` : '2px solid #FFFFFF',
        color: favorited ? ACCENT : '#FFFFFF',
        backgroundColor: favorited ? `${ACCENT}1a` : 'transparent',
        cursor: 'pointer',
      }}
      aria-label={favorited ? t('btn.inFavorites') : t('btn.favorite')}
    >
      {heartSvg}
    </button>
  )
}
