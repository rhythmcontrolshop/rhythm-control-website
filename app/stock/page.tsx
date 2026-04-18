import { Suspense } from 'react'
import Navigation    from '@/components/layout/Navigation'
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

function StockSkeleton() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000' }}>
      <div className="flex items-center justify-center" style={{ borderTop: '2px solid #FFFFFF', padding: '24px' }}>
        <h2 className="font-display text-center" style={{ color: '#FFFFFF', fontSize: 'clamp(3.5rem, 8.4vw, 7rem)', lineHeight: '1' }}>
          STOCK
        </h2>
      </div>
      <div className="flex items-center justify-center py-32">
        <div className="inline-block w-6 h-6 border-2 border-t-transparent animate-spin" style={{ borderColor: '#F0E040', borderTopColor: 'transparent' }} />
      </div>
    </main>
  )
}

async function StockContent() {
  const { releases, total, genres } = await getInitialData()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000' }}>
      <div className="flex items-center justify-center" style={{ borderTop: '2px solid #FFFFFF', padding: '24px' }}>
        <h2 className="font-display text-center" style={{ color: '#FFFFFF', fontSize: 'clamp(3.5rem, 8.4vw, 7rem)', lineHeight: '1' }}>
          STOCK
        </h2>
      </div>
      <CatalogueView initialReleases={releases} initialTotal={total} genres={genres} />
      <div style={{ height: '48px' }} />
      <StrobeDots />
    </main>
  )
}

export default function StockPage() {
  return (
    <>
      <Navigation />
      <Suspense fallback={<StockSkeleton />}>
        <StockContent />
      </Suspense>
      <Footer />
    </>
  )
}
