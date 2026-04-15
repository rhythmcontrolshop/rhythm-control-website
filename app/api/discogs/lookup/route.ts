// app/api/discogs/lookup/route.ts
// GET /api/discogs/lookup?barcode=XXX
// Busca un disco por código de barras en Discogs y comprueba si está en inventario.

import { searchByBarcode }  from '@/lib/discogs/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest }  from 'next/server'

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')?.trim()

  if (!barcode) {
    return Response.json(
      { error: 'Parámetro "barcode" requerido' },
      { status: 400 }
    )
  }

  try {
    const searchResponse = await searchByBarcode(barcode)

    if (!searchResponse.results.length) {
      return Response.json(
        { error: 'No se encontró ningún disco con ese código de barras' },
        { status: 404 }
      )
    }

    const topResult = searchResponse.results[0]

    // Comprobar si ya está en nuestro inventario de Supabase
    const supabase = createAdminClient()
    const { data: inInventory } = await supabase
      .from('releases')
      .select('*')
      .eq('discogs_release_id', topResult.id)
      .maybeSingle()

    return Response.json({
      discogs:       topResult,
      inventory:     inInventory ?? null,
      total_results: searchResponse.pagination.items,
      all_results:   searchResponse.results.slice(0, 5),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error buscando en Discogs'
    return Response.json({ error: message }, { status: 500 })
  }
}
