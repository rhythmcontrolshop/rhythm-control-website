// app/login/page.tsx
import { loginCustomer } from './actions'
import PasswordInput from '@/components/ui/PasswordInput'

const ERRORS: Record<string, string> = {
  'credenciales-incorrectas': 'Email o contraseña incorrectos.',
  'campos-requeridos':        'Rellena todos los campos.',
}

export default async function CustomerLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>
}) {
  const { error, redirect: redirectUrl } = await searchParams
  const errorMsg = error ? (ERRORS[error] ?? 'Error de autenticación.') : null

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#000000' }}
    >
      <div className="w-full max-w-xs">

        <div className="text-center mb-10">
          <h1 className="font-display text-2xl" style={{ color: '#FFFFFF' }}>
            RHYTHM CONTROL
          </h1>
          <p className="font-meta text-xs mt-2" style={{ color: '#FFFFFF' }}>
            MI CUENTA
          </p>
        </div>

        <hr className="separator mb-8" />

        <form action={loginCustomer} className="flex flex-col gap-5">
          <input type="hidden" name="redirect" value={redirectUrl || '/cuenta'} />

          <div>
            <label htmlFor="email" className="font-meta text-xs block mb-2"
              style={{ color: '#FFFFFF' }}>
              EMAIL
            </label>
            <input
              id="email" name="email" type="email"
              required autoFocus autoComplete="email"
              className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
              style={{ border: '2px solid #FFFFFF', color: '#FFFFFF',
                       letterSpacing: 'var(--rc-tracking-mono)' }}
              placeholder="tu@email.com"
            />
          </div>

          <PasswordInput
            id="password"
            name="password"
            label="CONTRASEÑA"
          />

          {errorMsg && (
            <p className="font-meta text-xs" style={{ color: '#ef4444' }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full font-display text-sm py-3"
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
          >
            ENTRAR
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a
            href="/registro"
            className="block font-meta text-xs underline hover:opacity-60 transition-opacity"
            style={{ color: '#FFFFFF' }}
          >
            ¿No tienes cuenta? Regístrate
          </a>
          <a
            href="/recuperar"
            className="block font-meta text-xs underline hover:opacity-60 transition-opacity"
            style={{ color: '#FFFFFF' }}
          >
            ¿Has olvidado tu contraseña?
          </a>
        </div>
      </div>
    </main>
  )
}
