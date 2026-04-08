// app/page.tsx
// Página principal — catálogo público.
// Server Component: obtiene releases iniciales y géneros desde la API.
// Renderiza Navigation + CatalogueView (client).

import Navigation    from '@/components/layout/Navigation'
import CatalogueView from '@/components/store/CatalogueView'
import type { Release, PaginatedResponse } from '@/types'

async function getInitialData(): Promise<{ releases: Release[]; total: number; genres: string[] }> {
  try {
    // Usar URL absoluta para fetch en Server Component
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const res = await fetch(`${baseUrl}/api/catalogue?page=1`, {
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const json = (await res.json()) as PaginatedResponse<Release>

    // Extraer géneros únicos de los releases devueltos
    const genreSet = new Set<string>()
    json.data.forEach(r => r.genres?.forEach(g => genreSet.add(g)))
    const genres = Array.from(genreSet).sort()

    return { releases: json.data, total: json.total, genres }
  } catch {
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
