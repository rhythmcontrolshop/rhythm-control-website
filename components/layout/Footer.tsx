import Link from 'next/link'

interface FooterProps {
  variant?: 'yellow' | 'magenta' | 'green'
}

const LEGAL_LINKS = [
  { href: '/aviso-legal',  label: 'AVISO LEGAL'  },
  { href: '/privacidad',   label: 'PRIVACIDAD'   },
  { href: '/cookies',      label: 'COOKIES'      },
  { href: '/terminos',     label: 'TÉRMINOS'     },
]

export default function Footer({ variant = 'yellow' }: FooterProps) {
  const bgColor    = variant === 'magenta' ? '#FF00FF' : variant === 'green' ? '#77DD77' : '#F0E040'
  const borderColor = '#000000'
  const textColor   = '#000000'

  return (
    <footer style={{ backgroundColor: bgColor, borderTop: `2px solid ${borderColor}` }}>
      <div className="grid grid-cols-2 md:grid-cols-6" style={{ minHeight: '120px' }}>

        <div className="col-span-2 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <h3 className="font-display text-2xl" style={{ color: textColor }}>RHYTHM CONTROL BARCELONA</h3>
          <p className="font-mono text-xs mt-2" style={{ color: textColor }}>
            Rda. de Sant Pau, 19-21, Local 28<br />
            Eixample, 08015 Barcelona<br />
            696 59 21 06
          </p>
          <p className="font-mono text-xs mt-2" style={{ color: textColor }}>
            LUN–VIE 15:00–19:45 · MIÉ hasta 20:00<br />
            SÁB 12:00–19:45 · DOM CERRADO
          </p>
        </div>

        <div className="col-span-1 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <nav className="flex flex-col gap-2">
            <Link href="/stock"     className="font-display text-xs hover:underline" style={{ color: textColor }}>STOCK</Link>
            <Link href="/novedades" className="font-display text-xs hover:underline" style={{ color: textColor }}>NOVEDADES</Link>
            <Link href="/contacto"  className="font-display text-xs hover:underline" style={{ color: textColor }}>CONTACTO</Link>
          </nav>
        </div>

        <div className="col-span-1 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <nav className="flex flex-col gap-2">
            <a href="https://instagram.com/rhythmcontrol.bcn" target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline" style={{ color: textColor }}>INSTAGRAM →</a>
            <a href="https://mixcloud.com/rhythmcontrolshop"  target="_blank" rel="noopener noreferrer" className="font-display text-xs hover:underline" style={{ color: textColor }}>MIXCLOUD →</a>
          </nav>
        </div>

        <div className="col-span-2 p-6 flex flex-col justify-between">
          <div>
            <p className="font-display text-xs" style={{ color: textColor }}>NEWSLETTER</p>
            <div className="flex mt-2">
              <input
                type="email"
                placeholder="EMAIL"
                className="w-full p-2 font-mono text-xs placeholder:text-gray-400"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', border: 'none', outline: 'none' }}
              />
              <button className="px-3 font-display text-xs shrink-0"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}>
                →
              </button>
            </div>
          </div>
          <p className="font-mono text-[10px] mt-4" style={{ color: textColor }}>
            © 2026 RHYTHM CONTROL BARCELONA. ALL RIGHTS RESERVED.
          </p>
        </div>

      </div>

      {/* Legal links bar */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-6 py-3" style={{ borderTop: `1px solid ${borderColor}` }}>
        {LEGAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="font-mono text-[10px] hover:underline" style={{ color: textColor }}>
            {label}
          </Link>
        ))}
      </div>
    </footer>
  )
}
