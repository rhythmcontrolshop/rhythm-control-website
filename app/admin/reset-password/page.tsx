// app/admin/reset-password/page.tsx
import { resetPassword } from './actions'
import PasswordInput from '@/components/ui/PasswordInput'

export default async function AdminResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

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
            NUEVA CONTRASEÑA
          </p>
        </div>

        <hr className="separator mb-8" />

        <form action={resetPassword} className="flex flex-col gap-5">
          <PasswordInput
            id="password"
            name="password"
            label="NUEVA CONTRASEÑA"
            placeholder="Mínimo 6 caracteres"
            minLength={6}
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="CONFIRMAR CONTRASEÑA"
            placeholder="Repite la contraseña"
            minLength={6}
            autoComplete="new-password"
          />

          {error && (
            <p className="font-meta text-xs" style={{ color: '#ef4444' }}>
              {error === 'mismatch' ? 'Las contraseñas no coinciden' : 'Error al actualizar. El enlace puede haber expirado.'}
            </p>
          )}

          <button
            type="submit"
            className="w-full font-display text-sm py-3"
            style={{ backgroundColor: 'var(--rc-color-text)', color: 'var(--rc-color-bg)' }}
          >
            GUARDAR NUEVA CONTRASEÑA
          </button>
        </form>
      </div>
    </main>
  )
}
