'use client'
// components/ui/Marquee.tsx
// E4-6: Refactorizado para usar CSS custom properties.
// Antes: @keyframes únicos por instancia (24+ tarjetas = 48+ bloques CSS).
// Ahora: una sola @keyframes global, parametrizada con --mq-unit y --mq-duration.
// Respeta prefers-reduced-motion via globals.css.

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
  const [unitPx, setUnitPx]     = useState(200)
  const [duration, setDuration] = useState(4)

  useEffect(() => {
    if (!containerRef.current || !measureRef.current) return

    const containerW = containerRef.current.offsetWidth
    const textW      = measureRef.current.offsetWidth

    const doesOverflow = textW > containerW - 4
    setOverflows(doesOverflow)

    if (doesOverflow) {
      setUnitPx(textW)
      setDuration(textW / PX_PER_SECOND)
    }
  }, [text])

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

  // Si desborda: animación de scroll con CSS custom properties
  // Solo 2 repeticiones son necesarias (origen + duplicado) para seamless loop
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
        className={`inline-block font-display ${className}`}
        style={{
          // E4-6: CSS custom properties parametrizan la animación global
          '--mq-unit': `${unitPx}px`,
          '--mq-duration': `${duration}s`,
          animation: 'mq-scroll var(--mq-duration) linear infinite',
          willChange: 'transform',
          whiteSpace: 'nowrap',
        } as React.CSSProperties}
      >
        {/* Solo 2 copias: original + duplicado para seamless loop */}
        <span>{text}&nbsp;·&nbsp;</span>
        <span>{text}&nbsp;·&nbsp;</span>
      </span>
    </div>
  )
}
