import { SpinningR } from '@/components/ui/RhythmControlLogo'

export default function StockLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1C1C1C' }}>
      <div className="text-center">
        <SpinningR size={48} fill="#9E9893" />
        <p className="font-display text-xs mt-6" style={{ color: '#9E9893', letterSpacing: '0.07em' }}>CARGANDO…</p>
      </div>
    </main>
  )
}
