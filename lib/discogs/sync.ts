// lib/discogs/sync.ts
// Lógica de sincronización Discogs → Supabase.
// Obtiene el inventario completo paginado y hace upsert en la tabla releases.

import { createAdminClient } from '@/lib/supabase/admin'
import { getInventory }      from './client'
import { mapListingToRelease } from './mappers'

const PER_PAGE            = 100
const RATE_LIMIT_DELAY_MS = 1200  // ~50 req/min (Discogs permite 60)

export interface SyncResult {
  synced:     number
  markedSold: number
  error?:     string
}

export async function syncDiscogsInventory(): Promise<SyncResult> {
  const supabase  = createAdminClient()
  const username  = process.env.DISCOGS_USERNAME!

  // Crear registro del job
  const { data: job, error: jobError } = await supabase
    .from('sync_jobs')
    .insert({ type: 'discogs_inventory', status: 'running' })
    .select()
    .single()

  if (jobError || !job) {
    throw new Error('No se pudo registrar el sync job en Supabase')
  }

  const syncedListingIds: number[] = []
  let processedItems = 0

  try {
    // Primera página — obtenemos el total
    const firstPage  = await getInventory(username, 1, PER_PAGE)
    const totalPages = firstPage.pagination.pages
    const totalItems = firstPage.pagination.items

    await supabase
      .from('sync_jobs')
      .update({ items_total: totalItems })
      .eq('id', job.id)

    // Recopilar todas las páginas
    const allListings = [...firstPage.listings]

    for (let page = 2; page <= totalPages; page++) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS))
      const pageData = await getInventory(username, page, PER_PAGE)
      allListings.push(...pageData.listings)
    }

    // Upsert en Supabase — lote de 50 en 50
    const BATCH_SIZE = 50
    for (let i = 0; i < allListings.length; i += BATCH_SIZE) {
      const batch = allListings.slice(i, i + BATCH_SIZE)
      const mapped = batch.map(listing => {
        syncedListingIds.push(listing.id)
        return mapListingToRelease(listing)
      })

      const { error } = await supabase
        .from('releases')
        .upsert(mapped, { onConflict: 'discogs_listing_id' })

      if (!error) {
        processedItems += batch.length
        await supabase
          .from('sync_jobs')
          .update({ items_processed: processedItems })
          .eq('id', job.id)
      }
    }

    // Marcar como vendidos los listings que ya no están en el inventario
    let markedSold = 0

    if (syncedListingIds.length > 0) {
      const { data: activeReleases } = await supabase
        .from('releases')
        .select('id, discogs_listing_id')
        .eq('status', 'active')

      if (activeReleases) {
        const syncedSet   = new Set(syncedListingIds)
        const toMarkSold  = activeReleases
          .filter(r => !syncedSet.has(r.discogs_listing_id))
          .map(r => r.id)

        if (toMarkSold.length > 0) {
          markedSold = toMarkSold.length
          await supabase
            .from('releases')
            .update({ status: 'sold' })
            .in('id', toMarkSold)
        }
      }
    }

    // Completar job
    await supabase
      .from('sync_jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', job.id)

    return { synced: processedItems, markedSold }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'

    await supabase
      .from('sync_jobs')
      .update({
        status: 'failed',
        error: errorMsg,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return { synced: processedItems, markedSold: 0, error: errorMsg }
  }
}
