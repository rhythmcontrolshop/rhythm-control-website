// app/registro/page.tsx
import { registerCustomer } from './actions'
import PasswordInput from '@/components/ui/PasswordInput'

const ERRORS: Record<string, string> = {
  'email-existe':     'Este email ya está registrado.',
  'campos-requeridos': 'Rellena todos los campos.',
  'password-corto':   'La contraseña debe tener al menos 6 caracteres.',
}

export default async function CustomerRegister({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMsg = error ? (ERRORS[error] ?? 'Error en el registro.') : null

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
            CREAR CUENTA
          </p>
        </div>

        <hr className="separator mb-8" />

        <form action={registerCustomer} className="flex flex-col gap-5">
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
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            autoComplete="new-password"
          />

          <div>
            <label htmlFor="username" className="font-meta text-xs block mb-2"
              style={{ color: '#FFFFFF' }}>
              NOMBRE DE USUARIO (opcional)
            </label>
            <input
              id="username" name="username" type="text"
              autoComplete="username"
              className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
              style={{ border: '2px solid #FFFFFF', color: '#FFFFFF',
                       letterSpacing: 'var(--rc-tracking-mono)' }}
              placeholder="Tu nombre"
            />
          </div>

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
            CREAR CUENTA
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="font-meta text-xs underline hover:opacity-60 transition-opacity"
            style={{ color: '#FFFFFF' }}
          >
            ¿Ya tienes cuenta? Entra aquí
          </a>
        </div>
      </div>
    </main>
  )
}
