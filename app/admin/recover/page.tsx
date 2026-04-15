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
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="w-full max-w-xs">

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>
            RHYTHM CONTROL
          </h1>
          <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
            RECUPERAR CONTRASEÑA
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2rem' }} />

        {success ? (
          <div className="text-center">
            <p className="text-base font-bold mb-4" style={{ color: '#000000' }}>
              EMAIL ENVIADO
            </p>
            <p className="text-xs" style={{ color: '#374151' }}>
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </p>
            <a
              href="/admin/login"
              className="inline-block mt-6 text-xs px-6 py-3 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
            >
              VOLVER AL LOGIN
            </a>
          </div>
        ) : (
          <form action={recoverPassword} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="text-xs block mb-2" style={{ color: '#374151' }}>
                EMAIL
              </label>
              <input
                id="email" name="email" type="email"
                required autoFocus
                className="w-full text-sm px-4 py-3 focus:outline-none"
                style={{ border: '1px solid #d1d5db', color: '#000000', letterSpacing: '0.07em' }}
                placeholder="admin@rhythmcontrol.es"
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: '#ef4444' }}>
                Ha ocurrido un error. Inténtalo de nuevo.
              </p>
            )}

            <button
              type="submit"
              className="w-full text-sm py-3 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
            >
              ENVIAR EMAIL DE RECUPERACIÓN
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a
            href="/admin/login"
            className="text-xs underline hover:opacity-60 transition-opacity"
            style={{ color: '#6b7280' }}
          >
            ← Volver al login
          </a>
        </div>
      </div>
    </main>
  )
}
