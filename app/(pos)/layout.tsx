// app/(pos)/layout.tsx
// Layout para el POS — acceso directo en /pos, sin la navegación del sitio principal
// Protegido por auth admin (middleware ya gestiona /admin, añadimos /pos)

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
      {/* POS Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#333', backgroundColor: '#111' }}>
        <div className="flex items-center gap-3">
          <span className="font-display text-sm uppercase" style={{ color: '#F0E040', letterSpacing: '0.1em' }}>
            RHYTHM CONTROL POS
          </span>
          <span className="font-mono text-xs" style={{ color: '#666' }}>v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs" style={{ color: '#999' }}>
            {operatorName}
          </span>
          <a
            href="/admin"
            className="font-mono text-xs px-3 py-1"
            style={{ border: '1px solid #333', color: '#999' }}
          >
            ADMIN
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
