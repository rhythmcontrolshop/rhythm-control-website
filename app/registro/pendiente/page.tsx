import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function resendConfirmation(formData: FormData) {
  'use server'
  const email = ((formData.get('email') as string) ?? '').trim()
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  if (error) {
    redirect(`/registro/pendiente?email=${encodeURIComponent(email)}&resenderr=1`)
  }
  redirect(`/registro/pendiente?email=${encodeURIComponent(email)}&resent=1`)
}

export default async function PendientePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; resent?: string; resenderr?: string }>
}) {
  const { email = '', resent, resenderr } = await searchParams

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <div className="p-6 md:p-10 max-w-lg mx-auto">
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>CONFIRMA TU EMAIL</h1>
        </div>

        <p className="text-sm mb-2" style={{ color: '#6b7280' }}>
          Hemos enviado un email de confirmación a:
        </p>
        <p className="text-sm font-bold mb-8" style={{ color: '#000000' }}>
          {email || '—'}
        </p>

        {/* Step indicators */}
        <div className="flex items-center mb-8">
          {/* Step 1 – done */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center w-7 h-7 text-xs font-bold"
              style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>✓</div>
            <span className="text-[10px]" style={{ color: '#000000' }}>CUENTA</span>
          </div>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db', margin: '0 8px', marginBottom: '12px' }} />
          {/* Step 2 – active */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center w-7 h-7 text-xs font-bold"
              style={{ border: '2px solid #000000', color: '#000000' }}>2</div>
            <span className="text-[10px] font-bold" style={{ color: '#000000' }}>EMAIL</span>
          </div>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db', margin: '0 8px', marginBottom: '12px' }} />
          {/* Step 3 – locked */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center w-7 h-7 text-xs"
              style={{ border: '1px solid #d1d5db', color: '#9ca3af' }}>3</div>
            <span className="text-[10px]" style={{ color: '#9ca3af' }}>LISTO</span>
          </div>
        </div>

        {resent && (
          <div className="mb-4 p-3" style={{ border: '1px solid #22c55e', backgroundColor: '#f0fdf4' }}>
            <p className="text-xs" style={{ color: '#22c55e' }}>Email reenviado</p>
          </div>
        )}
        {resenderr && (
          <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
            <p className="text-xs" style={{ color: '#ef4444' }}>Error al reenviar. Inténtalo de nuevo.</p>
          </div>
        )}

        <form action={resendConfirmation}>
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className="text-xs px-8 py-3 transition-colors hover:opacity-90"
            style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
            REENVIAR EMAIL
          </button>
        </form>
      </div>
    </div>
  )
}
