// app/cuenta/layout.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

const NAV_LINKS = [
  { href: '/cuenta', label: 'RESUMEN' },
  { href: '/cuenta/pedidos', label: 'PEDIDOS' },
  { href: '/cuenta/favoritos', label: 'FAVORITOS' },
  { href: '/cuenta/datos', label: 'DATOS' },
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

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#000000' }}>
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-6"
        style={{ height: '56px', borderBottom: '2px solid #FFFFFF', backgroundColor: '#000000', zIndex: 100 }}>
        <span className="font-display text-sm" style={{ color: '#FFFFFF' }}>
          RHYTHM CONTROL{' '}
          <span style={{ color: '#F0E040' }}>/ MI CUENTA</span>
        </span>
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="font-meta text-xs transition-colors"
              style={{ color: '#FFFFFF' }}>{label}</Link>
          ))}
        </div>
        <LogoutButton />
      </nav>

      <div style={{ paddingTop: '56px' }}>
        {children}
      </div>
    </div>
  )
}
