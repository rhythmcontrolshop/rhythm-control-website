'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface Track {
  position: string
  title: string
  duration?: string
}

interface TrackPlayersProps {
  tracks: Track[]
  artist: string
  releaseId: string
}

declare global {
  interface Window {
    YT: {
      Player: any
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export function TrackPlayers({ tracks, artist, releaseId }: TrackPlayersProps) {
  return (
    <div className="flex flex-col gap-1">
      {tracks.map((track, index) => (
        <TrackPlayer
          key={track.position || `track-${index}`}
          track={track}
          artist={artist}
          releaseId={releaseId}
        />
      ))}
    </div>
  )
}

// =========================
// SINGLE TRACK PLAYER
// =========================

function TrackPlayer({ track, artist, releaseId }: { track: Track; artist: string; releaseId: string }) {
  // undefined = not searched yet, null = no result, string = video id
  const [youtubeId, setYoutubeId] = useState<string | null | undefined>(undefined)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const playerRef = useRef<any>(null)
  const containerIdRef = useRef<string>('')
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

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
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
  }, [])

  const startTracking = () => {
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
  }

  const stopTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }

  const seekTo = (percent: number) => {
    if (playerRef.current?.seekTo && duration > 0) {
      const time = (percent / 100) * duration
      playerRef.current.seekTo(time, true)
      setCurrentTime(time)
      setProgress(percent)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = ((e.clientX - rect.left) / rect.width) * 100
    seekTo(Math.max(0, Math.min(100, percent)))
  }

  const initPlayer = (videoId: string) => {
    const createPlayer = () => {
      containerIdRef.current = `yt-track-${videoId}-${Date.now()}`

      const container = document.createElement('div')
      container.id = containerIdRef.current
      container.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;'
      document.body.appendChild(container)

      playerRef.current = new window.YT.Player(container, {
        videoId,
        playerVars: { controls: 0, modestbranding: 1, rel: 0, autoplay: 1 },
        events: {
          onReady: () => {
            startTracking()
            setIsPlaying(true)
          },
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
      tag.async = true
      document.body.appendChild(tag)
      window.onYouTubeIframeAPIReady = () => createPlayer()
    } else if (window.YT.Player) {
      createPlayer()
    }
  }

  const searchAndPlay = async () => {
    // Already have a video — toggle play/pause
    if (youtubeId) {
      if (isPlaying) {
        playerRef.current?.pauseVideo()
        stopTracking()
        setIsPlaying(false)
      } else {
        if (playerRef.current) {
          playerRef.current.playVideo()
          startTracking()
        }
        setIsPlaying(true)
      }
      return
    }

    // No result already found — do nothing
    if (youtubeId === null) return

    // Search YouTube
    setIsSearching(true)

    try {
      const query = `${artist} ${track.title}`
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}&releaseId=${releaseId}&trackPosition=${encodeURIComponent(track.position)}`
      )
      const data = await res.json()

      if (data.videoId) {
        setYoutubeId(data.videoId)
        setFromCache(data.cached || false)
        setIsSearching(false)
        initPlayer(data.videoId)
      } else {
        setYoutubeId(null)
        setIsSearching(false)
      }
    } catch (e) {
      console.error('YouTube search error:', e)
      setYoutubeId(null)
      setIsSearching(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ── Searching ──────────────────────────────────────────────────────────────
  if (isSearching) {
    return (
      <div className="flex items-center" style={{ backgroundColor: '#1a1a1a', height: '42px', border: '1px solid #2a2a2a' }}>
        <div className="w-10 h-full flex items-center justify-center flex-shrink-0">
          <span className="font-display text-xs animate-pulse" style={{ color: '#F0E040' }}>···</span>
        </div>
        <div className="flex-1 min-w-0 px-2">
          <p className="font-display text-xs truncate" style={{ color: '#FFFFFF' }}>
            {track.position} — {track.title}
          </p>
          <p className="font-meta text-[10px]" style={{ color: '#FFFFFF555' }}>Buscando...</p>
        </div>
      </div>
    )
  }

  // ── No video found ─────────────────────────────────────────────────────────
  if (youtubeId === null) {
    return (
      <div className="flex items-center" style={{ backgroundColor: '#0d0d0d', height: '42px', border: '1px solid #1a1a1a' }}>
        <div className="w-10 h-full flex items-center justify-center flex-shrink-0">
          <span className="font-display text-xs" style={{ color: '#2a2a2a' }}>—</span>
        </div>
        <div className="flex-1 min-w-0 px-2">
          <p className="font-display text-xs truncate" style={{ color: '#333333' }}>
            {track.position} — {track.title}
          </p>
        </div>
        {track.duration && (
          <span className="font-meta text-[10px] px-2" style={{ color: '#2a2a2a' }}>{track.duration}</span>
        )}
      </div>
    )
  }

  // ── Player (video found) ───────────────────────────────────────────────────
  if (youtubeId) {
    return (
      <div className="flex items-center overflow-hidden" style={{ backgroundColor: '#1a1a1a', height: '42px', border: '1px solid #2a2a2a' }}>
        <button
          onClick={searchAndPlay}
          className="w-10 h-full flex items-center justify-center transition flex-shrink-0"
          style={{ color: '#FFFFFF' }}
          type="button"
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="8,5 20,12 8,19" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0 px-2">
          <p className="font-display text-xs truncate" style={{ color: '#FFFFFF' }}>
            {track.position} — {track.title}
            {fromCache && <span style={{ color: '#22c55e' }}> ✓</span>}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className="flex-1 h-1 overflow-hidden cursor-pointer"
              style={{ backgroundColor: '#333333' }}
              onClick={handleProgressClick}
            >
              <div
                className="h-full transition-all duration-100"
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

        <div className="flex items-center px-2 flex-shrink-0" style={{ color: '#444444' }}>
          <svg width="14" height="10" viewBox="0 0 16 11" fill="currentColor">
            <path d="M15.7 1.7c-.2-.7-.7-1.2-1.4-1.4C13 0 8 0 8 0S3 0 1.7.3C1 .5.5 1 .3 1.7 0 3 0 5.5 0 5.5s0 2.5.3 3.8c.2.7.7 1.2 1.4 1.4C3 11 8 11 8 11s5 0 6.3-.3c.7-.2 1.2-.7 1.4-1.4C16 8 16 5.5 16 5.5s0-2.5-.3-3.8zM6.4 7.8V3.2L10.5 5.5 6.4 7.8z"/>
          </svg>
        </div>
      </div>
    )
  }

  // ── Default: click to search ───────────────────────────────────────────────
  return (
    <div
      className="flex items-center overflow-hidden cursor-pointer"
      style={{ backgroundColor: '#1a1a1a', height: '42px', border: '1px solid #1a1a1a' }}
      onClick={searchAndPlay}
    >
      <div
        className="w-10 h-full flex items-center justify-center flex-shrink-0"
        style={{ color: '#FFFFFF555' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="8,5 20,12 8,19" />
        </svg>
      </div>

      <div className="flex-1 min-w-0 px-2">
        <p className="font-display text-xs truncate" style={{ color: '#FFFFFF' }}>
          {track.position} — {track.title}
        </p>
        {track.duration && (
          <p className="font-meta text-[10px]" style={{ color: '#444444' }}>{track.duration}</p>
        )}
      </div>

      <span className="font-meta text-[10px] px-2 flex-shrink-0" style={{ color: '#333333' }}>▶</span>
    </div>
  )
}
