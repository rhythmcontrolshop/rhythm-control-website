'use client'
// context/FavoritesContext.tsx
// E4-3: Batch favorites — un solo fetch para todos los FavoriteButton.
// Evita N+1 requests (24 tarjetas = 1 request en vez de 24).

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface FavoritesContextType {
  favorites: Set<number>               // Set de discogs_release_id
  loaded: boolean
  toggle: (releaseId: string, discogsReleaseId: number | undefined, currentlyFavorited: boolean) => Promise<boolean>
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [loaded, setLoaded] = useState(false)

  // Un solo fetch al montar — obtiene TODOS los favoritos del usuario
  useEffect(() => {
    let cancelled = false
    async function loadFavorites() {
      try {
        const res = await fetch('/api/cuenta/favoritos')
        if (!res.ok) { setLoaded(true); return }
        const data = await res.json()
        if (!cancelled && data.favorites) {
          const ids = data.favorites
            .map((f: any) => f.discogs_release_id)
            .filter(Boolean) as number[]
          setFavorites(new Set(ids))
        }
      } catch {
        // Silencioso — favoritos no disponibles
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    loadFavorites()
    return () => { cancelled = true }
  }, [])

  const toggle = useCallback(async (
    releaseId: string,
    discogsReleaseId: number | undefined,
    currentlyFavorited: boolean,
  ): Promise<boolean> => {
    if (!discogsReleaseId) return currentlyFavorited

    try {
      if (currentlyFavorited) {
        const res = await fetch('/api/cuenta/favoritos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ release_id: releaseId }),
        })
        if (res.ok) {
          setFavorites(prev => { const next = new Set(prev); next.delete(discogsReleaseId); return next })
          return false
        }
      } else {
        const res = await fetch('/api/cuenta/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ release_id: releaseId }),
        })
        if (res.ok) {
          setFavorites(prev => { const next = new Set(prev); next.add(discogsReleaseId); return next })
          return true
        }
      }
    } catch { /* silencioso */ }
    return currentlyFavorited
  }, [])

  return (
    <FavoritesContext.Provider value={{ favorites, loaded, toggle }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  return ctx  // Puede ser null — FavoriteButton maneja el fallback
}
