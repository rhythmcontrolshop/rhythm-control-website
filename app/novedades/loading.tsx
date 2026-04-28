import { SpinningR } from '@/components/ui/RhythmControlLogo'

export default function NovedadesLoading() {
  return (
    <main className="relative min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F03E3E' }}>
      <div className="text-center">
        <SpinningR size={48} fill="#000000" />
        <p className="font-display text-xs mt-6" style={{ color: '#000000', letterSpacing: '0.07em' }}>CARGANDO…</p>
      </div>
    </main>
  )
}
