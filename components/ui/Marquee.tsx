'use client'
// components/ui/Marquee.tsx
// Robust marquee: measures text vs container, scrolls only when overflowing.
// Uses CSS custom properties --mq-unit / --mq-duration with global @keyframes mq-scroll.
// ResizeObserver re-measures on container resize.

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

    // Measure after layout paint
    const raf = requestAnimationFrame(doMeasure)

    // Re-measure when container resizes
    const ro = new ResizeObserver(doMeasure)
    ro.observe(container)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [text])

  // Static version: text fits — show with ellipsis as fallback
  if (!overflows) {
    return (
      <div
        ref={containerRef}
        className={`font-display ${className}`}
        style={{ overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', ...style }}
      >
        <span
          ref={measureRef}
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {text}
        </span>
      </div>
    )
  }

  // Scrolling version: text overflows — animate with seamless loop
  return (
    <div
      ref={containerRef}
      className={`font-display ${className}`}
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', ...style }}
    >
      {/* Hidden measure span — always present for ResizeObserver */}
      <span
        ref={measureRef}
        aria-hidden
        style={{ visibility: 'hidden', position: 'absolute', whiteSpace: 'nowrap' }}
      >
        {text}&nbsp;·&nbsp;
      </span>

      {/* Scrolling content — 2 copies for seamless loop */}
      <span
        className="inline-block"
        style={{
          '--mq-unit': `${unitPx}px`,
          '--mq-duration': `${duration}s`,
          animation: 'mq-scroll var(--mq-duration) linear infinite',
          willChange: 'transform',
          whiteSpace: 'nowrap',
        } as React.CSSProperties}
      >
        <span>{text}&nbsp;·&nbsp;</span>
        <span>{text}&nbsp;·&nbsp;</span>
      </span>
    </div>
  )
}
