'use client'
// components/ui/FlyerPlaceholder.tsx
// Bold 45° diagonal stripes — yellow on black.
// ~8 lines visible per column width.

interface FlyerPlaceholderProps {
  title: string
  date?:  string
  type?:  string
  code?:  string
}

export function FlyerPlaceholder({ title, date = '', code = 'RC-001' }: FlyerPlaceholderProps) {
  const W      = 300
  const H      = 450
  const PERIOD = 40   // px between stripe centers (horizontal spacing)
  // At 45° the horizontal coverage per stroke = LWIDTH * √2, so for 50/50:
  // LWIDTH * √2 = PERIOD / 2  →  LWIDTH = PERIOD / (2√2) ≈ 14
  const LWIDTH = 14
  const START  = -H   // start well off-screen left so top edge is always covered
  const COUNT  = Math.ceil((W + H * 2) / PERIOD) + 2

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      aria-label={title}
      role="img"
    >
      {/* Background */}
      <rect width={W} height={H} fill="#000000" />

      {/* Yellow 45° diagonal stripes — \ direction */}
      {Array.from({ length: COUNT }, (_, i) => (
        <line
          key={i}
          x1={START + i * PERIOD}     y1={0}
          x2={START + i * PERIOD + H} y2={H}
          stroke="#F0E040"
          strokeWidth={LWIDTH}
        />
      ))}

      {/* Minimal labels — code top-left, date bottom-right */}
      <text
        x="10" y="18"
        fill="#000000"
        fontSize="8"
        fontWeight="bold"
        fontFamily="'Courier New', monospace"
      >
        {code}
      </text>
      {date && (
        <text
          x={W - 10} y={H - 10}
          textAnchor="end"
          fill="#000000"
          fontSize="8"
          fontWeight="bold"
          fontFamily="'Courier New', monospace"
        >
          {date}
        </text>
      )}
    </svg>
  )
}
