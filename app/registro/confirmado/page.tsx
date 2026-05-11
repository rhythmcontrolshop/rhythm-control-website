import Link from 'next/link'

export default function ConfirmadoPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <div className="p-6 md:p-10 max-w-lg mx-auto">
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>¡CUENTA VERIFICADA!</h1>
        </div>

        <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
          Tu email ha sido confirmado. Ya puedes acceder a tu cuenta.
        </p>

        <Link
          href="/cuenta"
          className="inline-block text-xs px-8 py-3 transition-colors hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
          IR A MI CUENTA
        </Link>
      </div>
    </div>
  )
}
