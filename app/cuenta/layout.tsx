import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

const CUENTA_NAV = [
  { href: '/cuenta', label: 'CUENTA', icon: '☐' },
  { href: '/cuenta/pedidos', label: 'MIS PEDIDOS', icon: '☐' },
  { href: '/cuenta/favoritos', label: 'MIS FAVORITOS', icon: '☐' },
  { href: '/cuenta/datos', label: 'MIS DATOS', icon: '☐' },
  { href: '/stock', label: 'TIENDA', icon: '☐' },
]

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/cuenta')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', user.id)
    .single()

  const { count: favoritesCount } = await supabase
    .from('wantlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const displayName = profile?.username || profile?.email?.split('@')[0] || 'USUARIO'

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#000000' }}>
      {/* ── Top bar: Logo only ── */}
      <nav className="fixed top-0 left-0 right-0 flex items-center px-6"
        style={{ height: '56px', borderBottom: '2px solid #FFFFFF', backgroundColor: '#000000', zIndex: 100, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link href="/" className="font-display" style={{ color: '#FFFFFF', fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', textDecoration: 'none', lineHeight: '1' }}>
          RHYTHM CONTROL
        </Link>
      </nav>

      {/* ── Sticky sidebar nav (desktop) / scroll row (mobile) ── */}
      <div className="fixed left-0 right-0 md:left-0 md:right-auto"
        style={{ top: '56px', height: 'auto', borderBottom: '2px solid #FFFFFF', backgroundColor: '#000000', zIndex: 90 }}>
        {/* Mobile: horizontal scroll */}
        <div className="flex md:hidden overflow-x-auto" style={{ minHeight: '44px' }}>
          {CUENTA_NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="font-display text-[0.6rem] px-4 py-3 whitespace-nowrap transition-colors duration-150 hover:bg-[#F0E040] hover:text-black active:bg-[#F0E040] active:text-black border-r border-white/20"
              style={{ color: '#FFFFFF', textDecoration: 'none', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
              {item.label}
            </Link>
          ))}
        </div>
        {/* Desktop: vertical sidebar */}
        <div className="hidden md:flex flex-col" style={{ width: '220px', minHeight: 'calc(100dvh - 56px)', borderRight: '2px solid #FFFFFF' }}>
          {/* User greeting */}
          <div className="p-4" style={{ borderBottom: '2px solid #FFFFFF' }}>
            <p className="font-meta text-[0.6rem]" style={{ color: '#999' }}>BIENVENIDO</p>
            <p className="font-display text-sm truncate" style={{ color: '#F0E040' }}>{displayName}</p>
          </div>

          {/* Nav links */}
          <div className="flex-1 py-2">
            {CUENTA_NAV.map(item => (
              <Link key={item.href} href={item.href}
                className="font-display text-xs px-4 py-3 block transition-colors duration-150 hover:bg-[#F0E040] hover:text-black active:bg-[#F0E040] active:text-black"
                style={{ color: '#FFFFFF', textDecoration: 'none', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                {item.label}{item.href === '/cuenta/favoritos' && favoritesCount ? ` (${favoritesCount})` : ''}
              </Link>
            ))}
          </div>

          {/* Logout at bottom */}
          <div className="p-4" style={{ borderTop: '2px solid #FFFFFF' }}>
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="md:ml-[220px]" style={{ paddingTop: '56px' }}>
        {/* Mobile: extra padding for the horizontal nav */}
        <div className="md:hidden" style={{ paddingTop: '44px' }} />
        {children}
      </div>
    </div>
  )
}
