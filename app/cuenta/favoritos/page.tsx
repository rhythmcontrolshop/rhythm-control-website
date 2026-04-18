import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import RemoveFavorite from './RemoveFavorite'
import BuyButton from './BuyButton'

export default async function FavoritosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Step 1: Fetch wantlist items (stored data: title, artists, cover_image)
  const { data: favorites } = await supabase
    .from('wantlist')
    .select('id, added_at, discogs_release_id, title, artists, cover_image')
    .eq('user_id', user!.id)
    .order('added_at', { ascending: false })

  // Step 2: Fetch live release data by discogs_release_id for current status/price
  const discogsIds = (favorites ?? []).map(f => f.discogs_release_id).filter(Boolean)
  let releaseMap = new Map<number, any>()

  if (discogsIds.length > 0) {
    const { data: releases } = await supabase
      .from('releases')
      .select('id, discogs_release_id, title, artists, cover_image, price, status, condition, format, labels, discogs_listing_id')
      .in('discogs_release_id', discogsIds)
    ;(releases ?? []).forEach(r => {
      if (r.discogs_release_id) releaseMap.set(r.discogs_release_id, r)
    })
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>MIS FAVORITOS</h1>

      {(!favorites || favorites.length === 0) ? (
        <div className="text-center py-20">
          <p className="font-meta text-sm" style={{ color: '#FFFFFF' }}>Tu lista de favoritos está vacía.</p>
          <a href="/stock" className="inline-block mt-6 font-display text-xs px-6 py-3 transition-colors duration-200"
            style={{ backgroundColor: '#FFFFFF', color: '#000000', border: '2px solid #000000', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}>EXPLORAR STOCK</a>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav: any) => {
            // Use live release data when available, fall back to stored wantlist data
            const liveRelease = fav.discogs_release_id ? releaseMap.get(fav.discogs_release_id) : null
            const displayTitle = liveRelease?.title || fav.title || '—'
            const displayArtist = (liveRelease?.artists || fav.artists || [])[0] || '—'
            const displayCover = liveRelease?.cover_image || fav.cover_image || ''
            const displayPrice = liveRelease?.price
            const isAvailable = liveRelease ? liveRelease.status === 'active' : false

            return (
              <div key={fav.id} className="flex gap-4 p-4" style={{ border: '2px solid #FFFFFF' }}>
                <div className="w-20 h-20 shrink-0 relative" style={{ border: '1px solid #333' }}>
                  {displayCover ? (
                    <Image src={displayCover} alt={displayTitle} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full bg-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{displayArtist}</p>
                  <p className="font-display text-sm" style={{ color: '#F0E040' }}>{displayTitle}</p>
                  {displayPrice != null && (
                    <p className="font-meta text-xs mt-1" style={{ color: '#FFFFFF' }}>{Number(displayPrice).toFixed(2)} €</p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <span className="font-meta text-xs px-2 py-1"
                    style={{ border: isAvailable ? '1px solid #22c55e' : '1px solid #ef4444', color: isAvailable ? '#22c55e' : '#ef4444' }}>
                    {isAvailable ? 'DISPONIBLE' : (liveRelease ? 'VENDIDO' : 'N/A')}
                  </span>
                  {isAvailable && liveRelease && <BuyButton release={liveRelease} />}
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
