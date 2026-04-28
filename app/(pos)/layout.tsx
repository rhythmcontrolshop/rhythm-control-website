// app/(pos)/layout.tsx
// Layout para el POS — acceso directo en /pos, sin la navegación del sitio principal
// Protegido por auth admin (middleware ya gestiona /admin, añadimos /pos)
// WHITE THEME — clean, professional, Apple-like aesthetic

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function POSLayout({ children }: { children: React.ReactNode }) {
  // Verificar que el usuario es admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login?redirect=/pos')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/admin/login?error=sin-permisos')
  }

  const operatorName = profile.first_name ?? profile.last_name ?? 'Operario'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
    >
      {/* POS Header — White, clean, professional */}
      <header
        className="flex items-center justify-between px-5 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-display text-sm tracking-wide"
            style={{ color: '#000000', letterSpacing: '0.06em' }}
          >
            RHYTHM CONTROL
          </span>
          <span
            className="font-display text-[10px] px-2 py-0.5"
            style={{ backgroundColor: '#F0E040', color: '#000000', letterSpacing: '0.08em' }}
          >
            POS
          </span>
          <span
            className="font-mono text-[10px]"
            style={{ color: '#9CA3AF' }}
          >
            v1.0
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center font-display text-[10px]"
              style={{ backgroundColor: '#F3F4F6', color: '#000000' }}
            >
              {operatorName.charAt(0).toUpperCase()}
            </div>
            <span className="font-mono text-xs" style={{ color: '#6B7280' }}>
              {operatorName}
            </span>
          </div>
          <a
            href="/admin"
            className="font-mono text-xs px-3 py-1.5 min-h-[44px] flex items-center transition-colors"
            style={{
              border: '1px solid #E5E7EB',
              color: '#6B7280',
              backgroundColor: '#FAFAFA',
              textDecoration: 'none',
            }}
          >
            ← Admin
          </a>
        </div>
      </header>

      {/* POS Content */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  )
}
