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

  // Verificar que Discogs token está configurado
  if (!process.env.DISCOGS_ACCESS_TOKEN) {
    console.error('DISCOGS_ACCESS_TOKEN not configured')
    return Response.json(
      { error: 'Discogs API no configurada. Falta DISCOGS_ACCESS_TOKEN.' },
      { status: 503 }
    )
  }

  try {
    const searchResponse = await searchByBarcode(barcode)

    if (!searchResponse?.results?.length) {
      return Response.json(
        { error: 'No se encontró ningún disco con ese código de barras' },
        { status: 404 }
      )
    }

    const topResult = searchResponse.results[0]

    // Comprobar si ya está en nuestro inventario de Supabase
    let inInventory = null
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('releases')
        .select('*')
        .eq('discogs_release_id', topResult.id)
        .maybeSingle()
      inInventory = data ?? null
    } catch (dbErr) {
      // No bloquear la respuesta si Supabase falla — seguir sin datos de inventario
      console.error('Supabase lookup error (non-fatal):', dbErr)
    }

    return Response.json({
      discogs:       topResult,
      inventory:     inInventory,
      total_results: searchResponse.pagination?.items ?? 1,
      all_results:   searchResponse.results.slice(0, 5),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error buscando en Discogs'
    console.error('Discogs lookup error:', message)

    // Detectar errores comunes y dar mensajes útiles
    if (message.includes('401')) {
      return Response.json(
        { error: 'Token de Discogs inválido. Revisa DISCOGS_ACCESS_TOKEN en .env' },
        { status: 503 }
      )
    }
    if (message.includes('429')) {
      return Response.json(
        { error: 'Límite de peticiones a Discogs alcanzado. Espera un momento e inténtalo de nuevo.' },
        { status: 429 }
      )
    }

    return Response.json({ error: message }, { status: 500 })
  }
}
