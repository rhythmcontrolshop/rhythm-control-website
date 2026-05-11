import { SpinningR } from '@/components/ui/RhythmControlLogo'

export default function NovedadesLoading() {
  return (
    <main className="relative min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
      <div className="text-center">
        <SpinningR size={48} fill="#F0E040" />
        <p className="font-display text-xs mt-6" style={{ color: '#F0E040', letterSpacing: '0.07em' }}>CARGANDO…</p>
      </div>
    </main>
  )
}
