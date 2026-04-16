'use client'
// components/ui/Marquee.tsx
// Solo hace scroll si el texto excede el ancho del contenedor.
// Si cabe, muestra texto estático sin animación.

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
  const [repeats, setRepeats]   = useState(4)
  const [unitPx, setUnitPx]     = useState(200)
  const [duration, setDuration] = useState(4)

  useEffect(() => {
    if (!containerRef.current || !measureRef.current) return

    const containerW = containerRef.current.offsetWidth
    const textW      = measureRef.current.offsetWidth

    const doesOverflow = textW > containerW - 4
    setOverflows(doesOverflow)

    if (doesOverflow) {
      const minTotal = containerW * 2 + textW
      const reps = Math.max(4, Math.ceil(minTotal / textW))
      setRepeats(reps)
      setUnitPx(textW)
      setDuration(textW / PX_PER_SECOND)
    }
  }, [text])

  const animName = `mq${text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'x'}`

  // Si no desborda: texto estático con ellipsis
  if (!overflows) {
    return (
      <div
        ref={containerRef}
        style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style }}
      >
        <span
          ref={measureRef}
          className={`font-display ${className}`}
          style={{ visibility: 'hidden', position: 'absolute', whiteSpace: 'nowrap' }}
        >
          {text}&nbsp;·&nbsp;
        </span>
        <span
          className={`font-display ${className}`}
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
        >
          {text}
        </span>
      </div>
    )
  }

  // Si desborda: animación de scroll
  return (
    <div
      ref={containerRef}
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style }}
    >
      <span
        ref={measureRef}
        className={`font-display ${className}`}
        style={{ visibility: 'hidden', position: 'absolute', whiteSpace: 'nowrap' }}
      >
        {text}&nbsp;·&nbsp;
      </span>

      <style>{`
        @keyframes ${animName} {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${unitPx}px); }
        }
      `}</style>

      <span
        className={`inline-block font-display ${className}`}
        style={{
          animation:  `${animName} ${duration}s linear infinite`,
          whiteSpace: 'nowrap',
        }}
      >
        {Array.from({ length: repeats }).map((_, i) => (
          <span key={i}>{text}&nbsp;·&nbsp;</span>
        ))}
      </span>
    </div>
  )
}
