import Navigation    from '@/components/layout/Navigation'
import Hero          from '@/components/home/Hero'
import CatalogueView from '@/components/store/CatalogueView'
import StrobeDots    from '@/components/ui/StrobeDots'
import Footer        from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import type { Release } from '@/types'

async function getInitialData(): Promise<{ releases: Release[]; total: number; genres: string[] }> {
  try {
    const supabase = await createClient()
    const { data, error, count } = await supabase.from('releases').select('*', { count: 'exact' }).eq('status', 'active').order('created_at', { ascending: false }).limit(24)
    if (error) return { releases: [], total: 0, genres: [] }
    const genreSet = new Set<string>()
    ;(data ?? []).forEach(r => r.genres?.forEach((g: string) => genreSet.add(g)))
    return { releases: data ?? [], total: count ?? 0, genres: Array.from(genreSet).sort() }
  } catch { return { releases: [], total: 0, genres: [] } }
}

export default async function Home() {
  const { releases, total, genres } = await getInitialData()

  return (
    <>
      <Navigation />
      <main style={{ minHeight: '100vh', backgroundColor: '#000000' }}>

        {/* Hero Section — TOP / MIX / AGENDA */}
        <Hero releases={releases} />

        {/* Spacer matching hero-tabs row height */}
        <div style={{ height: '48px', backgroundColor: '#000000' }} />

        {/* Catalogue Content + Pagination */}
        <CatalogueView initialReleases={releases} initialTotal={total} genres={genres} />

        {/* Spacer between pagination and animation */}
        <div style={{ height: '48px' }} />

        {/* Animation Separator */}
        <StrobeDots />

      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}
