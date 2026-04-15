'use client'
// components/store/FavoriteButton.tsx
// Botón de favorito con corazón amarillo (#F0E040).
// Se integra en RecordCard y RecordModal.

import { useState, useEffect } from 'react'
import { useLocale } from '@/context/LocaleContext'

interface FavoriteButtonProps {
  releaseId: string
  /** discogs_release_id del release (para buscar en wantlist) */
  discogsReleaseId?: number
  /** Si ya sabemos que es favorito (ej: desde el servidor) */
  initialFavorited?: boolean
  /** Tamaño del icono */
  size?: number
  /** Variante: 'card' (esquina superior) o 'modal' (botón inline) */
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
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(initialFavorited)

  // Comprobar estado al montar si no lo sabemos
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
      } catch {
        // silencioso — usuario no logueado
      }
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
    } catch {
      // silencioso
    }

    setLoading(false)
  }

  // Corazón SVG
  const heartSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={favorited ? '#F0E040' : 'none'}
      stroke={favorited ? '#F0E040' : 'currentColor'}
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
        className="absolute top-2 right-2 z-30 p-1.5 transition-opacity hover:opacity-80"
        style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderRadius: '50%',
          opacity: !checked ? 0 : favorited ? 1 : 0.5,
          transition: 'opacity 0.2s ease',
        }}
        aria-label={favorited ? t('btn.inFavorites') : t('btn.favorite')}
      >
        {heartSvg}
      </button>
    )
  }

  // Modal variant: botón inline
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 font-display text-xs px-4 py-2 transition-colors hover:opacity-80 shrink-0"
      style={{
        border: favorited ? '2px solid #F0E040' : '2px solid #FFFFFF',
        color: favorited ? '#F0E040' : '#FFFFFF',
        backgroundColor: favorited ? 'rgba(240,224,64,0.1)' : 'transparent',
      }}
      aria-label={favorited ? t('btn.inFavorites') : t('btn.favorite')}
    >
      {heartSvg}
      {favorited ? t('btn.inFavorites') : t('btn.favorite')}
    </button>
  )
}
