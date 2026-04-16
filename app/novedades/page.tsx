import Navigation      from '@/components/layout/Navigation'
import Footer          from '@/components/layout/Footer'
import NovedadesGrid   from '@/components/novedades/NovedadesGrid'
import { Marquee }     from '@/components/ui/Marquee'
import { createClient } from '@/lib/supabase/server'

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

export default async function NovedadesPage() {
  const supabase = await createClient()
  
  // Filtrar discos de los últimos 30 días naturales
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoff = thirtyDaysAgo.toISOString()
  
  const { data: releases } = await supabase
    .from('releases')
    .select('*')
    .eq('status', 'active')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navigation variant="magenta" />
      <main className="relative min-h-screen" style={{ backgroundColor: '#000000' }}>
        
        {/* Background Layer: Stripes */}
        <div className="absolute inset-0 z-0">
          <MagentaStripes />
        </div>

        {/* Content Layer */}
        <div className="relative z-10">
          
          {/* Header: Título centrado gigante */}
          <header className="border-b-2 border-black">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6">
                
                {/* Margen izq */}
                <div className="hidden md:block" />

                {/* Título centrado */}
                <div className="col-span-1 md:col-span-4 p-4 md:p-6 flex items-center justify-center">
                   <h1 className="font-display w-full text-center" style={{ color: '#FFFFFF', fontSize: 'clamp(3.5rem, 8.4vw, 7rem)', lineHeight: '1' }}>
                      NOVEDADES
                   </h1>
                </div>

                {/* Margen der */}
                <div className="hidden md:block" />

            </div>
            
            {/* Marquee con fondo negro */}
            <div className="border-t-2 border-black bg-black py-2">
              <Marquee text="NOVETATS · NOVEDADES · NEW · NEUHEITEN · NOUVEAUTÉS · NOVITÀ · 新着 · НОВИНКИ · 신상품" style={{ color: '#FFFFFF', fontSize: '1.2rem', lineHeight: '1.2' }} />
            </div>
          </header>

          {/* Grid */}
          <section className="p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-0 max-w-7xl mx-auto">
              
              <div className="hidden md:block" />
              
              <div className="col-span-1 md:col-span-4 bg-black p-[2px]">
                <NovedadesGrid releases={releases || []} />
              </div>

              <div className="hidden md:block" />

            </div>
          </section>

        </div>
      </main>
      
      <Footer variant="magenta" />
    </>
  )
}
