'use client'
// E4-5: Migrado de rAF a CSS @keyframes.
// Antes: 60 re-renderizados/segundo via requestAnimationFrame.
// Ahora: renderizado único, animación via CSS transform (GPU-composited).
// Respeta prefers-reduced-motion via globals.css.

import React, { useRef, useEffect, useState } from 'react'

const ROWS = [
  { dotSize: 8,  gap: 5,  speed: 60,  scale: 1.2 },
  { dotSize: 13, gap: 7,  speed: 28,  scale: 1.2 },
  { dotSize: 18, gap: 7,  speed: 0,   scale: 1.2 * 0.7 },
  { dotSize: 13, gap: 9,  speed: -28, scale: 1.2 },
]
const ROW_HEIGHTS = [18, 18, 26, 18]
const HEIGHT = ROW_HEIGHTS.reduce((a, b) => a + b, 0)

export default function StrobeDots() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    if (containerRef.current) {
      ro.observe(containerRef.current)
      setWidth(containerRef.current.offsetWidth)
    }
    return () => ro.disconnect()
  }, [])

  // Generar filas de dots como SVG, con CSS animation inline
  let y = 0
  const rowElements: React.JSX.Element[] = []

  ROWS.forEach((row, i) => {
    const unit = row.dotSize + row.gap
    const r = (row.dotSize / 2) * row.scale
    const cy = y + ROW_HEIGHTS[i] / 2

    // Calcular cuántos dots necesitamos para cubrir el ancho + 2x para loop seamless
    const dotsPerUnit = 1
    const totalDots = Math.ceil(width / unit) + dotsPerUnit + 2

    // Generar dots para esta fila
    const dots: React.JSX.Element[] = []
    for (let j = -1; j < totalDots; j++) {
      const cx = j * unit + row.dotSize / 2
      dots.push(
        <circle key={j} cx={cx} cy={cy} r={r} fill="white" />
      )
    }

    // Duración de la animación basada en velocidad
    // speed = pixels/segundo, unit = ancho de un ciclo
    // duration = unit / speed segundos para un ciclo completo
    const duration = row.speed !== 0 ? Math.abs(unit / row.speed) : Infinity
    const direction = row.speed < 0 ? 'reverse' : 'normal'

    // Grupo animado: duplicamos los dots para loop seamless
    // translateX(0) → translateX(-unit) o translateX(unit) según dirección
    const animationStyle: React.CSSProperties = row.speed !== 0
      ? {
          animation: `strobe-row-${i} ${duration}s linear infinite`,
          animationDirection: direction,
          willChange: 'transform',
        }
      : {}

    rowElements.push(
      <g key={i} style={animationStyle}>
        {dots}
        {/* Duplicado para seamless loop */}
        <g transform={`translate(${totalDots * unit}, 0)`}>
          {dots.map((d, j) => React.cloneElement(d, { key: `dup-${j}` }))}
        </g>
      </g>
    )

    y += ROW_HEIGHTS[i]
  })

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 0',
        borderTop: '2px solid #FFFFFF',
      }}
    >
      {/* Scoped @keyframes para cada fila */}
      <style>{`
        @keyframes strobe-row-0 { 0% { transform: translateX(0); } 100% { transform: translateX(-${ROWS[0].dotSize + ROWS[0].gap}px); } }
        @keyframes strobe-row-1 { 0% { transform: translateX(0); } 100% { transform: translateX(-${ROWS[1].dotSize + ROWS[1].gap}px); } }
        @keyframes strobe-row-3 { 0% { transform: translateX(0); } 100% { transform: translateX(${ROWS[3].dotSize + ROWS[3].gap}px); } }
      `}</style>

      <svg width={width} height={HEIGHT} style={{ display: 'block', overflow: 'hidden' }}>
        <rect width={width} height={HEIGHT} fill="black" />
        {rowElements}
      </svg>
    </div>
  )
}
