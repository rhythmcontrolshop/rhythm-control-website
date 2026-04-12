'use client'
// components/ui/Marquee.tsx
// Velocidad constante (px/s). Rellena el contenedor con las repeticiones
// necesarias para que el loop sea siempre continuo y sin saltos.

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
  const [repeats, setRepeats]   = useState(4)
  const [unitPx, setUnitPx]     = useState(200)
  const [duration, setDuration] = useState(4)

  useEffect(() => {
    if (!containerRef.current || !measureRef.current) return

    const containerW = containerRef.current.offsetWidth
    const textW      = measureRef.current.offsetWidth  // ancho de "text · "

    // Necesitamos al menos containerW * 2 de contenido para que el loop
    // nunca muestre el final
    const minTotal  = containerW * 2 + textW
    const reps      = Math.max(4, Math.ceil(minTotal / textW))

    setRepeats(reps)
    setUnitPx(textW)
    setDuration(textW / PX_PER_SECOND)
  }, [text])

  // Animación keyframe inline: mueve exactamente un "textW" → seamless
  const animName = `mq-${text.slice(0, 8).replace(/\s/g, '')}`

  return (
    <div
      ref={containerRef}
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style }}
    >
      {/* Span oculto para medir el ancho de una unidad */}
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
          animation:      `${animName} ${duration}s linear infinite`,
          whiteSpace:     'nowrap',
        }}
      >
        {Array.from({ length: repeats }).map((_, i) => (
          <span key={i}>{text}&nbsp;·&nbsp;</span>
        ))}
      </span>
    </div>
  )
}
