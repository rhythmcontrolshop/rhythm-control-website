// components/admin/ScanResult.tsx
// Muestra el resultado de buscar un disco por código de barras.

import Image from 'next/image'
import type { DiscogsSearchResult } from '@/lib/discogs/client'
import type { Release }              from '@/types'

interface ScanResultData {
  discogs:       DiscogsSearchResult
  inventory:     Release | null
  total_results: number
  all_results:   DiscogsSearchResult[]
}

interface ScanResultProps {
  data: ScanResultData
}

export default function ScanResult({ data }: ScanResultProps) {
  const { discogs, inventory } = data

  // Discogs retorna "Artista - Título" en el campo title
  const [artist, title] = discogs.title.includes(' - ')
    ? discogs.title.split(' - ')
    : ['', discogs.title]

  return (
    <div style={{ border: '1px solid #d1d5db', backgroundColor: '#FFFFFF' }}>

      {/* Cabecera: portada + datos */}
      <div
        className="flex gap-4 p-4"
        style={{ borderBottom: '1px solid #e5e7eb' }}
      >
        {discogs.cover_image && (
          <div className="relative shrink-0 overflow-hidden" style={{ width: 72, height: 72 }}>
            <Image
              src={discogs.cover_image}
              alt={discogs.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {artist && (
            <p className="text-sm font-bold truncate" style={{ color: '#000000' }}>
              {artist}
            </p>
          )}
          <p
            className="text-xs truncate mt-0.5"
            style={{ color: artist ? '#6b7280' : '#000000' }}
          >
            {title}
          </p>

          <div className="flex flex-wrap gap-3 mt-2">
            {discogs.year && (
              <Tag>{discogs.year}</Tag>
            )}
            {discogs.label?.[0] && (
              <Tag>{discogs.label[0]}</Tag>
            )}
            {discogs.format?.[0] && (
              <Tag>{discogs.format[0]}</Tag>
            )}
            {discogs.country && (
              <Tag>{discogs.country}</Tag>
            )}
          </div>
        </div>
      </div>

      {/* Géneros / estilos */}
      {(discogs.genre?.length || discogs.style?.length) ? (
        <div
          className="px-4 py-3 flex flex-wrap gap-2"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          {[...(discogs.genre ?? []), ...(discogs.style ?? [])].map(g => (
            <span key={g} className="text-xs" style={{ color: '#6b7280' }}>
              {g}
            </span>
          ))}
        </div>
      ) : null}

      {/* Estado en inventario */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
        {inventory ? (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#6b7280' }}>
              EN INVENTARIO
            </span>
            <div className="flex gap-4 items-center">
              <span className="text-xs font-bold" style={{ color: '#000000' }}>
                {inventory.condition}
              </span>
              <span className="text-xs" style={{ color: '#000000' }}>
                {inventory.price.toLocaleString('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </span>
              {inventory.bpm && (
                <span
                  className="text-xs px-1"
                  style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
                >
                  {inventory.bpm} BPM
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            No está en el inventario actual
          </p>
        )}
      </div>

      {/* Link a Discogs */}
      <div className="px-4 py-3">
        <a
          href={`https://www.discogs.com/release/${discogs.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs transition-colors hover:text-black"
          style={{ color: '#6b7280' }}
        >
          Ver en Discogs (ID: {discogs.id}) →
        </a>
      </div>

    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs" style={{ color: '#6b7280' }}>
      {children}
    </span>
  )
}
