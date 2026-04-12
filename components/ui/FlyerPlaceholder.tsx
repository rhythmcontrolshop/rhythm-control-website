'use client'
// components/ui/FlyerPlaceholder.tsx
// SVG placeholder inspired by The Designer Republic — dot grid, crosshair,
// registration marks, coordinate axes, ghost type, yellow accent.
// Fills its container like object-cover (position: absolute, inset: 0).

interface FlyerPlaceholderProps {
  title: string
  date?:  string   // pre-formatted, e.g. "SÁB 18 ABRIL"
  type?:  string   // e.g. "DJ SET"
  code?:  string   // e.g. "RC-EVT-001" — also used to make pattern id unique
}

function splitTitle(t: string): [string, string] {
  const MAX = 13
  const up  = t.toUpperCase()
  if (up.length <= MAX) return [up, '']
  const words = up.split(' ')
  let a = ''
  let b = ''
  for (const w of words) {
    if (!a || a.length + 1 + w.length <= MAX) a += (a ? ' ' : '') + w
    else b += (b ? ' ' : '') + w
  }
  if (b.length > MAX + 2) b = b.slice(0, MAX) + '…'
  return [a, b]
}

export function FlyerPlaceholder({ title, date = '', type = '', code = 'RC-001' }: FlyerPlaceholderProps) {
  const [line1, line2] = splitTitle(title)
  const hasTwo  = Boolean(line2)
  const titleY  = hasTwo ? 340 : 354

  // Unique id per instance — avoids SVG pattern id collisions when multiple
  // placeholders appear on the same page
  const uid = `fp-${code.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      viewBox="0 0 300 450"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      aria-label={title}
      role="img"
    >
      <defs>
        {/* Dot grid — tiny circles every 15px */}
        <pattern id={uid} width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="7.5" cy="7.5" r="0.7" fill="#1a1a1a" />
        </pattern>
      </defs>

      {/* ── Background ── */}
      <rect width="300" height="450" fill="#000" />
      <rect width="300" height="450" fill={`url(#${uid})`} />

      {/* ── Large circle — backbone of the composition ── */}
      <circle cx="150" cy="195" r="126" stroke="#1d1d1d" strokeWidth="1"   fill="none" />
      <circle cx="150" cy="195" r="104" stroke="#161616" strokeWidth="0.5" fill="none" />

      {/* ── Crosshair ── */}
      <line x1="0"   y1="195" x2="300" y2="195" stroke="#181818" strokeWidth="0.5" />
      <line x1="150" y1="0"   x2="150" y2="450" stroke="#181818" strokeWidth="0.5" />

      {/* Tick marks at N / S / E / W on outer circle */}
      <line x1="150" y1="64"  x2="150" y2="78"  stroke="#2a2a2a" strokeWidth="1.2" />
      <line x1="150" y1="312" x2="150" y2="326" stroke="#2a2a2a" strokeWidth="1.2" />
      <line x1="19"  y1="195" x2="33"  y2="195" stroke="#2a2a2a" strokeWidth="1.2" />
      <line x1="267" y1="195" x2="281" y2="195" stroke="#2a2a2a" strokeWidth="1.2" />

      {/* ── Corner registration marks ── */}
      <rect x="8"   y="8"   width="10" height="10" stroke="#2a2a2a" strokeWidth="1" fill="none" />
      <rect x="282" y="8"   width="10" height="10" stroke="#2a2a2a" strokeWidth="1" fill="none" />
      <rect x="8"   y="432" width="10" height="10" stroke="#2a2a2a" strokeWidth="1" fill="none" />
      <rect x="282" y="432" width="10" height="10" stroke="#2a2a2a" strokeWidth="1" fill="none" />
      {/* Inner corner dots */}
      <circle cx="13"  cy="13"  r="1.5" fill="#2a2a2a" />
      <circle cx="287" cy="13"  r="1.5" fill="#2a2a2a" />
      <circle cx="13"  cy="437" r="1.5" fill="#2a2a2a" />
      <circle cx="287" cy="437" r="1.5" fill="#2a2a2a" />

      {/* ── Ghost "NO FLYER" — large, very dark, texture layer ── */}
      <text x="150" y="182" textAnchor="middle" fill="#0e0e0e"
        fontSize="50" fontWeight="bold" fontFamily="'Courier New', monospace" letterSpacing="-2">
        NO
      </text>
      <text x="150" y="234" textAnchor="middle" fill="#0e0e0e"
        fontSize="50" fontWeight="bold" fontFamily="'Courier New', monospace" letterSpacing="-2">
        FLYER
      </text>

      {/* ── Y-axis ruler (left edge) ── */}
      <text x="4" y="70"  fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">050</text>
      <text x="4" y="135" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">100</text>
      <text x="4" y="200" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">150</text>
      <text x="4" y="265" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">200</text>
      <text x="4" y="330" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">250</text>
      <text x="4" y="395" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">300</text>

      {/* ── X-axis ruler (bottom edge) ── */}
      <text x="46"  y="446" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">050</text>
      <text x="111" y="446" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">100</text>
      <text x="176" y="446" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">150</text>
      <text x="241" y="446" fill="#252525" fontSize="5.5" fontFamily="'Courier New', monospace">200</text>

      {/* ── Top metadata bar ── */}
      <line x1="20" y1="33" x2="280" y2="33" stroke="#1c1c1c" strokeWidth="0.5" />
      <text x="20"  y="26" fill="#F0E040" fontSize="7" fontFamily="'Courier New', monospace" fontWeight="bold">
        {code}
      </text>
      <text x="280" y="26" fill="#444" fontSize="7" fontFamily="'Courier New', monospace" textAnchor="end">
        {date}
      </text>

      {/* ── Yellow accent stripe — visual horizon ── */}
      <rect x="0" y="302" width="300" height="2.5" fill="#F0E040" />

      {/* ── Bottom panel ── */}
      <rect x="0" y="304" width="300" height="146" fill="#030303" />

      {/* Subtle vertical rule inside bottom panel */}
      <line x1="16" y1="310" x2="16" y2="440" stroke="#1c1c1c" strokeWidth="1" />

      {/* Title */}
      <text x="26" y={titleY} fill="#FFFFFF"
        fontSize="17" fontWeight="bold" fontFamily="'Courier New', monospace" letterSpacing="0.3">
        {line1}
      </text>
      {hasTwo && (
        <text x="26" y={titleY + 22} fill="#FFFFFF"
          fontSize="17" fontWeight="bold" fontFamily="'Courier New', monospace" letterSpacing="0.3">
          {line2}
        </text>
      )}

      {/* Type label */}
      {type && (
        <text x="26" y={titleY + (hasTwo ? 44 : 24)} fill="#F0E040"
          fontSize="7.5" fontFamily="'Courier New', monospace">
          {type}
        </text>
      )}

      {/* Bottom footnote */}
      <text x="26"  y="430" fill="#2e2e2e" fontSize="5.5" fontFamily="'Courier New', monospace">
        RHYTHM CONTROL — BCN
      </text>
      <text x="280" y="430" fill="#2e2e2e" fontSize="5.5" fontFamily="'Courier New', monospace" textAnchor="end">
        41.3851°N 2.1734°E
      </text>
    </svg>
  )
}
