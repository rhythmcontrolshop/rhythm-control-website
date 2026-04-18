export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
      <div className="text-center">
        <div className="inline-block w-6 h-6 border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: '#F0E040', borderTopColor: 'transparent' }} />
        <p className="text-xs" style={{ color: '#6b7280' }}>Cargando…</p>
      </div>
    </main>
  )
}
