'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// =========================
// TYPES
// =========================

interface UnifiedAudioPlayerProps {
  bandcampAlbumId?: string
  bandcampTrackId?: string
  youtubeId?: string
  artist: string
  title: string
}

declare global {
  interface Window {
    YT: {
      Player: any
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

// =========================
// COMPONENT
// =========================

export function UnifiedAudioPlayer({
  bandcampAlbumId,
  bandcampTrackId,
  youtubeId,
  artist,
  title,
}: UnifiedAudioPlayerProps) {
  const hasBandcamp = !!bandcampAlbumId
  const hasYouTube = !!youtubeId

  if (hasBandcamp) {
    return <BandcampStylePlayer albumId={bandcampAlbumId!} trackId={bandcampTrackId} />
  }

  if (hasYouTube) {
    return (
      <YouTubeStylePlayer
        videoId={youtubeId!}
        artist={artist}
        title={title}
      />
    )
  }

  return <NoAudioPlaceholder />
}

// =========================
// BANDCAMP
// =========================

function BandcampStylePlayer({ albumId, trackId }: { albumId: string; trackId?: string }) {
  const key = `${albumId}-${trackId || 'none'}`

  let src = `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=small/bgcol=333333/linkcol=ffffff/artwork=none/transparent=true/`
  if (trackId) {
    src = `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=small/bgcol=333333/linkcol=ffffff/artwork=none/track=${trackId}/transparent=true/`
  }

  return (
    <iframe
      key={key}
      style={{ border: 0, width: '100%', height: '42px', outline: 'none' }}
      src={src}
      seamless
    />
  )
}

// =========================
// YOUTUBE
// =========================

function YouTubeStylePlayer({ videoId, artist, title }: { videoId: string; artist: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const playerRef = useRef<any>(null)
  const containerIdRef = useRef<string>('')
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => { stopPlayer() }
  }, [videoId])

  useEffect(() => {
    return () => { stopPlayer() }
  }, [])

  const stopPlayer = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo()
        playerRef.current.destroy()
      } catch (e) {}
      playerRef.current = null
    }
    if (containerIdRef.current) {
      const el = document.getElementById(containerIdRef.current)
      if (el) el.remove()
      containerIdRef.current = ''
    }
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const startTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current)
    progressInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
        try {
          const time = playerRef.current.getCurrentTime()
          const dur = playerRef.current.getDuration()
          if (time && dur) {
            setCurrentTime(time)
            setDuration(dur)
            setProgress((time / dur) * 100)
          }
        } catch (e) {}
      }
    }, 250)
  }, [])

  const stopTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }, [])

  const seekTo = useCallback((percent: number) => {
    if (playerRef.current?.seekTo && duration > 0) {
      const time = (percent / 100) * duration
      playerRef.current.seekTo(time, true)
      setCurrentTime(time)
      setProgress(percent)
    }
  }, [duration])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = ((e.clientX - rect.left) / rect.width) * 100
    seekTo(Math.max(0, Math.min(100, percent)))
  }

  const togglePlay = useCallback(() => {
    if (!isPlaying) {
      if (!playerRef.current) {
        const initPlayer = () => {
          containerIdRef.current = `yt-player-${videoId}-${Date.now()}`

          const container = document.createElement('div')
          container.id = containerIdRef.current
          container.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;'
          document.body.appendChild(container)

          playerRef.current = new window.YT.Player(container, {
            videoId,
            playerVars: { controls: 0, modestbranding: 1, rel: 0, autoplay: 1 },
            events: {
              onReady: () => startTracking(),
              onStateChange: (event: number) => {
                if (event === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false)
                  stopTracking()
                  setProgress(0)
                  setCurrentTime(0)
                }
              },
            },
          })
        }

        if (!window.YT) {
          const tag = document.createElement('script')
          tag.src = 'https://www.youtube.com/iframe_api'
          document.body.appendChild(tag)
          window.onYouTubeIframeAPIReady = () => initPlayer()
        } else if (window.YT.Player) {
          initPlayer()
        }
      } else {
        playerRef.current.playVideo()
        startTracking()
      }
      setIsPlaying(true)
    } else {
      playerRef.current?.pauseVideo()
      stopTracking()
      setIsPlaying(false)
    }
  }, [isPlaying, videoId, startTracking, stopTracking])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="flex items-center overflow-hidden"
      style={{ backgroundColor: '#1a1a1a', height: '42px', border: '1px solid #2a2a2a' }}
    >
      <button
        onClick={togglePlay}
        className="w-10 h-full flex items-center justify-center transition flex-shrink-0"
        style={{ color: '#FFFFFF' }}
        type="button"
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 20,12 8,19" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0 px-2">
        <p className="font-display text-xs truncate" style={{ color: '#FFFFFF' }}>
          {artist} — {title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <div
            className="flex-1 h-1 overflow-hidden cursor-pointer"
            style={{ backgroundColor: '#333333' }}
            onClick={handleProgressClick}
          >
            <div
              className="h-full transition-all duration-100 pointer-events-none"
              style={{ width: `${progress}%`, backgroundColor: '#F0E040' }}
            />
          </div>
          {duration > 0 && (
            <span className="font-meta text-[10px] tabular-nums" style={{ color: '#FFFFFF666' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
        </div>
      </div>

      {/* YouTube logo */}
      <div className="flex items-center px-3 flex-shrink-0" style={{ color: '#FFFFFF555' }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <path d="M15.7 1.7c-.2-.7-.7-1.2-1.4-1.4C13 0 8 0 8 0S3 0 1.7.3C1 .5.5 1 .3 1.7 0 3 0 5.5 0 5.5s0 2.5.3 3.8c.2.7.7 1.2 1.4 1.4C3 11 8 11 8 11s5 0 6.3-.3c.7-.2 1.2-.7 1.4-1.4C16 8 16 5.5 16 5.5s0-2.5-.3-3.8zM6.4 7.8V3.2L10.5 5.5 6.4 7.8z"/>
        </svg>
      </div>
    </div>
  )
}

// =========================
// NO AUDIO
// =========================

function NoAudioPlaceholder() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ backgroundColor: '#0d0d0d', height: '42px', border: '1px solid #1a1a1a' }}
    >
      <span className="font-meta text-xs" style={{ color: '#333333' }}>Audio no disponible</span>
    </div>
  )
}
