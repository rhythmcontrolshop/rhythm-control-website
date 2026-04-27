import RhythmControlLogo from '@/components/ui/RhythmControlLogo'

export default function NovedadesLoading() {
  return (
    <main className="relative min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FF00FF' }}>
      <div className="text-center">
        <div className="rc-loader-spin inline-flex items-center justify-center">
          <RhythmControlLogo height="48px" fill="#000000" />
        </div>
        <p className="font-display text-xs mt-6" style={{ color: '#000000', letterSpacing: '0.07em' }}>CARGANDO…</p>
      </div>
    </main>
  )
}
