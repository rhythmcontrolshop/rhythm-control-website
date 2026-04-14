import Link from 'next/link'

interface FooterProps {
  variant?: 'yellow' | 'magenta'
}

export default function Footer({ variant = 'yellow' }: FooterProps) {
  const bgColor = variant === 'magenta' ? '#FF00FF' : '#F0E040' // Magenta vs Yellow
  const borderColor = '#000000'

  return (
    <footer style={{ backgroundColor: bgColor, borderTop: `2px solid ${borderColor}` }}>
      <div className="grid grid-cols-2 md:grid-cols-6" style={{ minHeight: '120px' }}>
        
        {/* Info Tienda */}
        <div className="col-span-2 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <h3 className="font-display text-2xl" style={{ color: '#000000' }}>RHYTHM CONTROL</h3>
          <p className="font-mono text-xs mt-2" style={{ color: '#000000' }}>
            CARRER DE JOAQUIN COSTA, 14<br />
            BARCELONA, 08001<br />
            LUN - SAB: 11:00 - 20:00
          </p>
        </div>

        {/* Links */}
        <div className="col-span-1 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
          <nav className="flex flex-col gap-2">
            <Link href="/" className="font-display text-xs hover:underline" style={{ color: '#000000' }}>CATÁLOGO</Link>
            <Link href="/novedades" className="font-display text-xs hover:underline" style={{ color: '#000000' }}>NOVEDADES</Link>
            <Link href="/contacto" className="font-display text-xs hover:underline" style={{ color: '#000000' }}>CONTACTO</Link>
          </nav>
        </div>

        {/* Social */}
        <div className="col-span-1 p-6" style={{ borderRight: `2px solid ${borderColor}` }}>
           <nav className="flex flex-col gap-2">
            <a href="https://instagram.com/rhythmcontrol" target="_blank" className="font-display text-xs hover:underline" style={{ color: '#000000' }}>INSTAGRAM →</a>
            <a href="https://mixcloud.com/rhythmcontrolshop" target="_blank" className="font-display text-xs hover:underline" style={{ color: '#000000' }}>MIXCLOUD →</a>
          </nav>
        </div>

        {/* Newsletter / Legal */}
        <div className="col-span-2 p-6 flex flex-col justify-between">
          <div>
            <p className="font-display text-xs" style={{ color: '#000000' }}>NEWSLETTER</p>
            <input 
              type="email" 
              placeholder="EMAIL" 
              className="mt-2 w-full p-2 font-mono text-xs"
              style={{ backgroundColor: '#000000', color: bgColor, border: 'none' }}
            />
          </div>
          <p className="font-mono text-[10px] mt-4" style={{ color: '#000000' }}>
            © 2026 RHYTHM CONTROL. ALL RIGHTS RESERVED.
          </p>
        </div>

      </div>
    </footer>
  )
}
