'use client'
// components/store/FloatingPlayer.tsx
// Player flotante que reproduce previews de Spotify.

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { PlayerTrack } from '@/types'

interface FloatingPlayerProps {
  track:     PlayerTrack
  clipIndex: number
  onClose:   () => void
}

export default function FloatingPlayer({ track, clipIndex, onClose }: FloatingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    async function fetchPreview() {
      if (!track.source_id) {
        setError(true)
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/audio/spotify/${track.source_id}`)
        const data = await res.json()

        if (data.preview_url) {
          setPreviewUrl(data.preview_url)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [track.source_id])

  useEffect(() => {
    if (previewUrl && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {})
    }
  }, [previewUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div
      className="fixed left-0 right-0 bottom-0 flex items-center"
      style={{
        height:          '80px',
        backgroundColor: '#000000',
        borderTop:       '2px solid #FFFFFF',
        zIndex:          90,
      }}
    >
      <div className="relative shrink-0" style={{ width: '80px', height: '80px' }}>
        {track.cover_image ? (
          <Image
            src={track.cover_image}
            alt={`${track.artist} — ${track.title}`}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: '#0a0a0a' }} />
        )}
      </div>

      <div className="flex flex-col justify-center px-4 flex-1 min-w-0">
        <p className="font-display text-sm truncate" style={{ color: '#FFFFFF' }}>
          {track.artist}
        </p>
        <p className="font-display text-sm truncate" style={{ color: '#F0E040' }}>
          {track.title}
        </p>
        <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
          CLIP {clipIndex}
        </p>
      </div>

      {(track.bpm || track.key) && (
        <div className="hidden md:flex items-center gap-2 px-4">
          {track.bpm && (
            <span className="font-meta text-xs px-2 py-0.5" style={{ backgroundColor: '#F0E040', color: '#000000' }}>
              {track.bpm} BPM
            </span>
          )}
          {track.key && (
            <span className="font-meta text-xs px-2 py-0.5" style={{ backgroundColor: '#F0E040', color: '#000000' }}>
              {track.key}
            </span>
          )}
        </div>
      )}

      <div className="hidden sm:flex items-center px-4">
        <span className="font-display text-sm" style={{ color: '#FFFFFF' }}>
          {track.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
        </span>
      </div>

      <div className="flex items-center gap-2 px-4">
        {loading && (
          <p className="font-meta text-xs animate-pulse" style={{ color: '#FFFFFF' }}>Cargando...</p>
        )}
        {error && (
          <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>Sin preview</p>
        )}
        {previewUrl && !error && (
          <>
            <audio ref={audioRef} src={previewUrl} onEnded={() => setIsPlaying(false)} onError={() => setError(true)} />
            <button
              className="flex items-center justify-center transition-colors"
              style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FFFFFF' }}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="4" width="4" height="16" fill="#000000" />
                  <rect x="14" y="4" width="4" height="16" fill="#000000" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '2px' }}>
                  <polygon points="5,3 19,12 5,21" fill="#000000" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>

      <button
        className="font-display text-xs px-4 transition-opacity hover:opacity-60"
        style={{ color: '#FFFFFF' }}
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  )
}
