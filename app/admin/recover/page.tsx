// app/admin/recover/page.tsx
import { recoverPassword } from './actions'

export default async function AdminRecover({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { success, error } = await searchParams

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--rc-color-bg)' }}
    >
      <div className="w-full max-w-xs">

        <div className="text-center mb-10">
          <h1 className="font-display text-2xl" style={{ color: 'var(--rc-color-text)' }}>
            RHYTHM CONTROL
          </h1>
          <p className="font-meta text-xs mt-2" style={{ color: '#FFFFFF' }}>
            RECUPERAR CONTRASEÑA
          </p>
        </div>

        <hr className="separator mb-8" />

        {success ? (
          <div className="text-center">
            <p className="font-display text-base mb-4" style={{ color: 'var(--rc-color-accent)' }}>
              EMAIL ENVIADO
            </p>
            <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </p>
            <a
              href="/admin/login"
              className="inline-block mt-6 font-display text-xs px-6 py-3"
              style={{ backgroundColor: 'var(--rc-color-text)', color: 'var(--rc-color-bg)' }}
            >
              VOLVER AL LOGIN
            </a>
          </div>
        ) : (
          <form action={recoverPassword} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="font-meta text-xs block mb-2"
                style={{ color: '#FFFFFF' }}>
                EMAIL
              </label>
              <input
                id="email" name="email" type="email"
                required autoFocus
                className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
                style={{ border: 'var(--rc-border-main)', color: 'var(--rc-color-text)',
                         letterSpacing: 'var(--rc-tracking-mono)' }}
                placeholder="admin@rhythmcontrol.es"
              />
            </div>

            {error && (
              <p className="font-meta text-xs" style={{ color: '#ef4444' }}>
                Ha ocurrido un error. Inténtalo de nuevo.
              </p>
            )}

            <button
              type="submit"
              className="w-full font-display text-sm py-3"
              style={{ backgroundColor: 'var(--rc-color-text)', color: 'var(--rc-color-bg)' }}
            >
              ENVIAR EMAIL DE RECUPERACIÓN
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a
            href="/admin/login"
            className="font-meta text-xs underline hover:opacity-60 transition-opacity"
            style={{ color: '#FFFFFF' }}
          >
            ← Volver al login
          </a>
        </div>
      </div>
    </main>
  )
}
