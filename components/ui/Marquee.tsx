'use client'
// components/ui/Marquee.tsx
// Seamless marquee: measures one unit (text + separator), scrolls with zero-gap loop.
// Uses unique keyframe per instance to avoid collisions.
// Separator " · " added between repetitions as requested.

import { useRef, useEffect, useState, useId } from 'react'

const DEFAULT_SPEED = 80  // px per second
const SEP = ' \u00B7 '   // space · space

interface MarqueeProps {
  text: string
  className?: string
  style?: React.CSSProperties
  speed?: number
}

export function Marquee({ text, className = '', style, speed = DEFAULT_SPEED }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef   = useRef<HTMLSpanElement>(null)
  const [overflows, setOverflows] = useState(false)
  const [unitPx, setUnitPx]       = useState(200)
  const [duration, setDuration]   = useState(5)

  // Unique keyframe name per instance to avoid CSS collisions
  const uid = useId().replace(/:/g, '')
  const kfName = `mq-${uid}`

  const unit = `${text}${SEP}`

  useEffect(() => {
    const container = containerRef.current
    const measure   = measureRef.current
    if (!container || !measure) return

    const doMeasure = () => {
      const cw = container.clientWidth
      const tw = measure.scrollWidth  // width of one unit: "text · "
      const doesOverflow = tw > cw + 2
      setOverflows(doesOverflow)
      if (doesOverflow) {
        setUnitPx(tw)
        setDuration(Math.max(tw / speed, 1.5))
      }
    }

    const raf = requestAnimationFrame(doMeasure)
    const ro = new ResizeObserver(doMeasure)
    ro.observe(container)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [text, speed])

  return (
    <div
      ref={containerRef}
      className={`font-display ${className}`}
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', ...style }}
    >
      {/* Hidden measure: one unit (always present for consistent measurement) */}
      <span
        ref={measureRef}
        aria-hidden
        style={{ visibility: 'hidden', position: 'absolute', whiteSpace: 'nowrap' }}
      >
        {unit}
      </span>

      {overflows ? (
        <span
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: `${kfName} ${duration}s linear infinite`,
            willChange: 'transform',
          }}
        >
          {unit}{unit}
        </span>
      ) : (
        <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )}

      {overflows && (
        <style>{`
          @keyframes ${kfName} {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${unitPx}px); }
          }
        `}</style>
      )}
    </div>
  )
}
