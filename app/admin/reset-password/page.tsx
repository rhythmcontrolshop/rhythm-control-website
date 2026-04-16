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
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="w-full max-w-xs">

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>
            RHYTHM CONTROL
          </h1>
          <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
            NUEVA CONTRASEÑA
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2rem' }} />

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
            <p className="text-xs" style={{ color: '#ef4444' }}>
              {error === 'mismatch' ? 'Las contraseñas no coinciden' : 'Error al actualizar. El enlace puede haber expirado.'}
            </p>
          )}

          <button
            type="submit"
            className="w-full text-sm py-3 transition-colors hover:opacity-90"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
          >
            GUARDAR NUEVA CONTRASEÑA
          </button>
        </form>
      </div>
    </main>
  )
}
