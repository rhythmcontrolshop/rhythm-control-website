'use client'
// components/ui/Marquee.tsx
// Marquee con velocidad constante en px/s para todos los usos.
// Así el hero (texto largo) y las cards (texto corto) van al mismo ritmo visual.

import { useRef, useEffect, useState } from 'react'

const PX_PER_SECOND = 80 // velocidad visual unificada

interface MarqueeProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Marquee({ children, className = '', style }: MarqueeProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const [duration, setDuration] = useState(20) // fallback

  useEffect(() => {
    if (spanRef.current) {
      // El span contiene el texto duplicado; -50% = ancho del texto original
      const w = spanRef.current.scrollWidth / 2
      setDuration(Math.max(4, w / PX_PER_SECOND))
    }
  }, [children])

  return (
    <div
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style }}
    >
      <span
        ref={spanRef}
        className={`inline-block ${className}`}
        style={{
          animation: `marquee ${duration}s linear infinite`,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </div>
  )
}
