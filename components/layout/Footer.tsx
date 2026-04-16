import Link from 'next/link'

interface FooterProps {
  variant?: 'yellow' | 'magenta' | 'green'
}

export default function Footer({ variant = 'yellow' }: FooterProps) {
  const bgColor = variant === 'magenta' ? '#FF00FF' : variant === 'green' ? '#77DD77' : '#F0E040'
  const borderColor = '#000000'
  const textColor = '#000000'

  return (
    <footer style={{ backgroundColor: bgColor, borderTop: `2px solid ${borderColor}` }}>
      <div className="grid grid-cols-2 md:grid-cols-6" style={{ minHeight: '120px' }}>
        
        {/* Info Tienda */}
        <div className="col-span-2 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <h3 className="font-display text-2xl" style={{ color: textColor }}>RHYTHM CONTROL</h3>
          <p className="font-mono text-xs mt-2" style={{ color: textColor }}>
            C/ DE LA SALUT, 57<br />
            BARCELONA, 08024<br />
            LUN - SAB: 11:00 - 20:00
          </p>
        </div>

        {/* Links */}
        <div className="col-span-1 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <nav className="flex flex-col gap-2">
            <Link href="/" className="font-display text-xs hover:underline" style={{ color: textColor }}>STOCK</Link>
            <Link href="/novedades" className="font-display text-xs hover:underline" style={{ color: textColor }}>NOVEDADES</Link>
            <Link href="/contacto" className="font-display text-xs hover:underline" style={{ color: textColor }}>CONTACTO</Link>
          </nav>
        </div>

        {/* Social */}
        <div className="col-span-1 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
           <nav className="flex flex-col gap-2">
            <a href="https://instagram.com/rhythmcontrol.bcn" target="_blank" className="font-display text-xs hover:underline" style={{ color: textColor }}>INSTAGRAM →</a>
            <a href="https://mixcloud.com/rhythmcontrolshop" target="_blank" className="font-display text-xs hover:underline" style={{ color: textColor }}>MIXCLOUD →</a>
          </nav>
        </div>

        {/* Newsletter / Legal */}
        <div className="col-span-2 p-6 flex flex-col justify-between">
          <div>
            <p className="font-display text-xs" style={{ color: textColor }}>NEWSLETTER</p>
            <input 
              type="email" 
              placeholder="EMAIL" 
              className="mt-2 w-full p-2 font-mono text-xs placeholder:text-white"
              style={{ backgroundColor: '#000000', color: '#FFFFFF', border: 'none' }}
            />
          </div>
          <p className="font-mono text-[10px] mt-4" style={{ color: textColor }}>
            © 2026 RHYTHM CONTROL. ALL RIGHTS RESERVED.
          </p>
        </div>

      </div>
    </footer>
  )
}
