// app/admin/login/page.tsx
import { login } from './actions'
import PasswordInput from '@/components/ui/PasswordInput'

const ERRORS: Record<string, string> = {
  'credenciales-incorrectas': 'Email o contraseña incorrectos.',
  'sin-permisos':             'Esta cuenta no tiene acceso al panel.',
  'campos-requeridos':        'Rellena todos los campos.',
}

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMsg  = error ? (ERRORS[error] ?? 'Error de autenticación.') : null

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
            PANEL DE ADMINISTRACIÓN
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2rem' }} />

        <form action={login} className="flex flex-col gap-5">

          <div>
            <label htmlFor="email" className="text-xs block mb-2" style={{ color: '#374151' }}>
              EMAIL
            </label>
            <input
              id="email" name="email" type="email"
              required autoFocus autoComplete="email"
              className="w-full text-sm px-4 py-3 focus:outline-none"
              style={{ border: '1px solid #d1d5db', color: '#000000', letterSpacing: '0.07em' }}
              placeholder="admin@rhythmcontrol.es"
            />
          </div>

          <PasswordInput
            id="password"
            name="password"
            label="CONTRASEÑA"
          />

          {errorMsg && (
            <p className="text-xs" style={{ color: '#ef4444' }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full text-sm py-3 transition-colors hover:opacity-90"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
          >
            ACCEDER
          </button>

        </form>

        <div className="mt-6 text-center">
          <a
            href="/admin/recover"
            className="text-xs underline hover:opacity-60 transition-opacity"
            style={{ color: '#6b7280' }}
          >
            ¿Has olvidado tu contraseña?
          </a>
        </div>
      </div>
    </main>
  )
}
