// app/page.tsx
// Página principal — catálogo público.
// Server Component: obtiene releases iniciales y géneros directamente de Supabase.

import Navigation    from '@/components/layout/Navigation'
import CatalogueView from '@/components/store/CatalogueView'
import { createClient } from '@/lib/supabase/server'
import type { Release } from '@/types'

async function getInitialData(): Promise<{ releases: Release[]; total: number; genres: string[] }> {
  try {
    const supabase = await createClient()

    const { data, error, count } = await supabase
      .from('releases')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(24)

    if (error) {
      console.error('Error fetching releases:', error)
      return { releases: [], total: 0, genres: [] }
    }

    // Extraer géneros únicos
    const genreSet = new Set<string>()
    ;(data ?? []).forEach(r => r.genres?.forEach((g: string) => genreSet.add(g)))
    const genres = Array.from(genreSet).sort()

    return { releases: data ?? [], total: count ?? 0, genres }
  } catch (err) {
    console.error('Error in getInitialData:', err)
    return { releases: [], total: 0, genres: [] }
  }
}

export default async function Home() {
  const { releases, total, genres } = await getInitialData()

  return (
    <>
      <Navigation />
      <main
        style={{
          paddingTop: 'var(--rc-nav-height)',
          minHeight:  '100vh',
          backgroundColor: 'var(--rc-color-bg)',
        }}
      >
        <CatalogueView
          initialReleases={releases}
          initialTotal={total}
          genres={genres}
        />
      </main>
    </>
  )
}
