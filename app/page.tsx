import { Suspense } from 'react'
import Navigation        from '@/components/layout/Navigation'
import Hero              from '@/components/home/Hero'
import CatalogueView     from '@/components/store/CatalogueView'
import StrobeDots        from '@/components/ui/StrobeDots'
import Footer            from '@/components/layout/Footer'
import AuthHashRedirect  from '@/components/auth/AuthHashRedirect'
import { createClient }  from '@/lib/supabase/server'
import type { Release }  from '@/types'

// E4-4: Proyección de columnas — solo las que la vista necesita
const HOME_COLUMNS = [
  'id', 'title', 'artists', 'price', 'cover_image', 'condition',
  'format', 'genres', 'styles', 'labels', 'year', 'country',
  'status', 'created_at', 'discogs_release_id', 'discogs_listing_id',
].join(',')

interface HomeRelease {
  id: string; title: string; artists: string[]; price: number
  cover_image: string | null; condition: string; format: string | null
  genres: string[] | null; styles: string[] | null; labels: string[]
  year: number | null; country: string | null; status: string
  created_at: string; discogs_release_id: number; discogs_listing_id: number
  [key: string]: unknown  // Allow additional fields from Supabase
}

async function getInitialData(): Promise<{ releases: Release[]; total: number; genres: string[] }> {
  try {
    const supabase = await createClient()
    const { data, error, count } = await supabase.from('releases').select(HOME_COLUMNS, { count: 'exact' }).eq('status', 'active').order('created_at', { ascending: false }).limit(24)
    if (error) return { releases: [], total: 0, genres: [] }
    const typedData = (data ?? []) as unknown as HomeRelease[]
    const genreSet = new Set<string>()
    typedData.forEach(r => r.genres?.forEach((g: string) => genreSet.add(g)))
    return { releases: typedData as unknown as Release[], total: count ?? 0, genres: Array.from(genreSet).sort() }
  } catch { return { releases: [], total: 0, genres: [] } }
}

function HomeSkeleton() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000' }}>
      <div className="flex items-center justify-center py-32">
        <div className="inline-block w-6 h-6 border-2 border-t-transparent animate-spin" style={{ borderColor: '#F0E040', borderTopColor: 'transparent' }} />
      </div>
    </main>
  )
}

async function HomeContent() {
  const { releases, total, genres } = await getInitialData()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000' }}>
      <Hero releases={releases} />
      <div style={{ height: '48px', backgroundColor: '#000000' }} />
      <CatalogueView initialReleases={releases} initialTotal={total} genres={genres} />
      <div style={{ height: '48px' }} />
      <StrobeDots />
    </main>
  )
}

export default function Home() {
  return (
    <>
      <AuthHashRedirect />
      <Navigation />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
      <Footer />
    </>
  )
}
