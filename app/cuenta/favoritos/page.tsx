// app/cuenta/favoritos/page.tsx
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import RemoveFavorite from './RemoveFavorite'

export default async function FavoritosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: favorites } = await supabase
    .from('wantlist')
    .select(`id, added_at, releases(id, title, artists, cover_image, price, status)`)
    .eq('user_id', user!.id)
    .order('added_at', { ascending: false })

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>
        MIS FAVORITOS
      </h1>

      {(!favorites || favorites.length === 0) ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>
            Tu lista de favoritos está vacía.
          </p>
          <a href="/" className="inline-block mt-6 font-display text-xs px-6 py-3"
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>
            EXPLORAR CATÁLOGO
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav: any) => {
            const release = fav.releases
            if (!release) return null

            return (
              <div key={fav.id} className="flex gap-4 p-4" style={{ border: '2px solid #FFFFFF' }}>
                <div className="w-20 h-20 shrink-0 relative" style={{ border: '1px solid #333' }}>
                  {release.cover_image ? (
                    <Image src={release.cover_image} alt={release.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-black" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>
                    {release.artists?.[0] || '—'}
                  </p>
                  <p className="font-display text-sm" style={{ color: '#F0E040' }}>
                    {release.title}
                  </p>
                  <p className="font-meta text-xs mt-1" style={{ color: '#FFFFFF' }}>
                    {release.price?.toFixed(2)} €
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="font-meta text-xs px-2 py-1"
                    style={{
                      border: release.status === 'active' ? '1px solid #22c55e' : '1px solid #ef4444',
                      color: release.status === 'active' ? '#22c55e' : '#ef4444'
                    }}>
                    {release.status === 'active' ? 'DISPONIBLE' : 'VENDIDO'}
                  </span>
                  <RemoveFavorite favoriteId={fav.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
