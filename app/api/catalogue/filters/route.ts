// app/api/catalogue/filters/route.ts
// E2-5: Endpoint dedicado para obtener TODOS los estilos y sellos únicos del catálogo
// (no solo los de la primera página de 24 items)

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Obtener solo las columnas de estilos y sellos de todos los releases activos
  const { data, error } = await supabase
    .from('releases')
    .select('styles, labels')
    .eq('status', 'active')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const styleSet = new Set<string>()
  const labelSet = new Set<string>()

  for (const release of data ?? []) {
    if (Array.isArray(release.styles)) {
      for (const s of release.styles) styleSet.add(s)
    }
    if (Array.isArray(release.labels)) {
      for (const l of release.labels) labelSet.add(l)
    }
  }

  return Response.json({
    styles: Array.from(styleSet).sort(),
    labels: Array.from(labelSet).sort(),
  })
}
