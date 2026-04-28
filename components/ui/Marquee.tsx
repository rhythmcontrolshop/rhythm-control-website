'use client'
// components/ui/Marquee.tsx
// Seamless marquee: measures text, scrolls only when overflowing.
// Uses translateX animation with proper unit calculation for zero-gap loop.

import { useRef, useEffect, useState } from 'react'

const PX_PER_SECOND = 80

interface MarqueeProps {
  text: string
  className?: string
  style?: React.CSSProperties
}

export function Marquee({ text, className = '', style }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef   = useRef<HTMLSpanElement>(null)
  const [overflows, setOverflows] = useState(false)
  const [unitPx, setUnitPx]       = useState(200)
  const [duration, setDuration]   = useState(5)

  useEffect(() => {
    const container = containerRef.current
    const measure   = measureRef.current
    if (!container || !measure) return

    const doMeasure = () => {
      const cw = container.clientWidth
      const tw = measure.scrollWidth
      const doesOverflow = tw > cw + 2
      setOverflows(doesOverflow)
      if (doesOverflow) {
        setUnitPx(tw)
        setDuration(Math.max(tw / PX_PER_SECOND, 2))
      }
    }

    const raf = requestAnimationFrame(doMeasure)
    const ro = new ResizeObserver(doMeasure)
    ro.observe(container)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [text])

  // Static: text fits
  if (!overflows) {
    return (
      <div
        ref={containerRef}
        className={`font-display ${className}`}
        style={{ overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', ...style }}
      >
        <span ref={measureRef} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {text}
        </span>
      </div>
    )
  }

  // Scrolling: seamless loop with CSS animation
  // The keyframe moves by exactly one unit (text + separator width)
  // Two copies are placed side by side so the loop is seamless
  return (
    <div
      ref={containerRef}
      className={`font-display ${className}`}
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', ...style }}
    >
      <span
        ref={measureRef}
        aria-hidden
        style={{ visibility: 'hidden', position: 'absolute', whiteSpace: 'nowrap' }}
      >
        {text}&ensp;
      </span>
      <span
        style={{
          display: 'inline-flex',
          whiteSpace: 'nowrap',
          animation: `mq-scroll ${duration}s linear infinite`,
          willChange: 'transform',
        } as React.CSSProperties}
      >
        <span style={{ paddingRight: '0.5em' }}>{text}</span>
        <span style={{ paddingRight: '0.5em' }}>{text}</span>
      </span>
      <style>{`
        @keyframes mq-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${unitPx}px); }
        }
      `}</style>
    </div>
  )
}
