import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

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
      {/* Minimal nav — logo + logout only, no sub-navigation */}
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-6"
        style={{ height: '72px', borderBottom: '2px solid #FFFFFF', backgroundColor: '#000000', zIndex: 100 }}>
        <Link href="/" className="font-display" style={{ color: '#FFFFFF', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', textDecoration: 'none', lineHeight: '1' }}>
          RHYTHM CONTROL
        </Link>
        <LogoutButton />
      </nav>

      <div style={{ paddingTop: '72px' }}>
        {children}
      </div>
    </div>
  )
}
