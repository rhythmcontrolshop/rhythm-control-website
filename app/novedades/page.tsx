import { Suspense } from 'react'
import Navigation      from '@/components/layout/Navigation'
import Footer          from '@/components/layout/Footer'
import NovedadesGrid   from '@/components/novedades/NovedadesGrid'
import { Marquee }     from '@/components/ui/Marquee'
import { createClient } from '@/lib/supabase/server'
import type { Release } from '@/types'

const MagentaStripes = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    version="1.1"
    viewBox="0 0 100 100" 
    preserveAspectRatio="xMidYMid slice"
    className="absolute inset-0 w-full h-full"
  >
    <rect width="100%" height="100%" fill="#000000"/>
    <defs>
      <pattern 
        id="diagonal-stripes" 
        patternUnits="userSpaceOnUse" 
        width="6" 
        height="6"
        patternTransform="rotate(45)"
      >
        <rect width="3" height="6" fill="#FF00FF"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#diagonal-stripes)"/>
  </svg>
)

function NovedadesSkeleton() {
  return (
    <div className="relative z-10">
      <header className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6">
          <div className="hidden md:block" />
          <div className="col-span-1 md:col-span-4 p-4 md:p-6 flex items-center justify-center">
            <h1 className="font-display w-full text-center" style={{ color: '#FFFFFF', fontSize: 'clamp(3.5rem, 8.4vw, 7rem)', lineHeight: '1' }}>
              NOVEDADES
            </h1>
          </div>
          <div className="hidden md:block" />
        </div>
      </header>
      <section className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-0 max-w-7xl mx-auto">
          <div className="hidden md:block" />
          <div className="col-span-1 md:col-span-4 bg-black p-[2px]">
            <div className="flex items-center justify-center py-32">
              <div className="inline-block w-6 h-6 border-2 border-t-transparent animate-spin" style={{ borderColor: '#F0E040', borderTopColor: 'transparent' }} />
            </div>
          </div>
          <div className="hidden md:block" />
        </div>
      </section>
    </div>
  )
}

// E2-3: Novedades con paginación server-side
const NOVEDADES_PER_PAGE = 24

// Columnas proyectadas para novedades (sin tracklist, comments, youtube IDs)
const NOVEDADES_COLUMNS = [
  'id', 'title', 'artists', 'price', 'cover_image', 'condition',
  'format', 'genres', 'styles', 'labels', 'year', 'country',
  'status', 'created_at', 'discogs_listing_id', 'discogs_release_id',
  'catno', 'currency', 'thumb', 'sleeve_condition', 'quantity',
].join(',')

async function NovedadesContent({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const perPage = NOVEDADES_PER_PAGE

  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoff = thirtyDaysAgo.toISOString()

  const from = (page - 1) * perPage

  const { data: releases, count } = await supabase
    .from('releases')
    .select(NOVEDADES_COLUMNS, { count: 'exact' })
    .eq('status', 'active')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1)

  return (
    <div className="relative z-10">
      <header className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6">
          <div className="hidden md:block" />
          <div className="col-span-1 md:col-span-4 p-4 md:p-6 flex items-center justify-center">
            <h1 className="font-display w-full text-center" style={{ color: '#FFFFFF', fontSize: 'clamp(3.5rem, 8.4vw, 7rem)', lineHeight: '1' }}>
              NOVEDADES
            </h1>
          </div>
          <div className="hidden md:block" />
        </div>
        <div className="border-t-2 border-black bg-black py-2">
          <Marquee text="NOVETATS · NOVEDADES · NEW · NEUHEITEN · NOUVEAUTÉS · NOVITÀ · 新着 · НОВИНКИ · 신상품 · NOVETATS · NOVEDADES · NEW · NEUHEITEN · NOUVEAUTÉS · NOVITÀ · 新着 · НОВИНКИ · 신상품" style={{ color: '#FFFFFF', fontSize: '1.2rem', lineHeight: '1.2' }} />
        </div>
      </header>
      <section className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-0 max-w-7xl mx-auto">
          <div className="hidden md:block" />
          <div className="col-span-1 md:col-span-4 bg-black p-[2px]">
            <NovedadesGrid
              releases={(releases as unknown as Release[]) || []}
              total={count ?? 0}
              page={page}
              perPage={perPage}
            />
          </div>
          <div className="hidden md:block" />
        </div>
      </section>
    </div>
  )
}

export default function NovedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  return (
    <>
      <Navigation variant="magenta" />
      <main className="relative min-h-screen" style={{ backgroundColor: '#000000' }}>
        <div className="absolute inset-0 z-0">
          <MagentaStripes />
        </div>
        <Suspense fallback={<NovedadesSkeleton />}>
          <NovedadesContent searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer variant="magenta" />
    </>
  )
}
