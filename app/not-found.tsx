import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#000000' }}>
      <div className="text-center max-w-md">
        <h1 className="font-display text-6xl mb-4" style={{ color: '#F0E040' }}>404</h1>
        <p className="text-lg mb-2" style={{ color: '#FFFFFF' }}>Página no encontrada</p>
        <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
          El disco que buscas no está en este estante.
        </p>
        <Link
          href="/"
          className="inline-block text-sm px-8 py-3 transition-colors hover:opacity-90"
          style={{ backgroundColor: '#F0E040', color: '#000000' }}
        >
          VOLVER AL INICIO
        </Link>
      </div>
    </main>
  )
}
