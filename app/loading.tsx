import RhythmControlLogo from '@/components/ui/RhythmControlLogo'

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
      <div className="text-center">
        <div className="rc-loader-spin inline-flex items-center justify-center">
          <RhythmControlLogo height="64px" fill="#F0E040" />
        </div>
        <p className="font-display text-xs mt-6" style={{ color: '#6b7280', letterSpacing: '0.07em' }}>CARGANDO…</p>
      </div>
    </main>
  )
}
