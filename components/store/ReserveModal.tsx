'use client'
import { useState } from 'react'
import { useLocale } from '@/context/LocaleContext'
import type { Release } from '@/types'

interface Props {
  release: Release
  onClose: () => void
  onSuccess: () => void
}

export default function ReserveModal({ release, onClose, onSuccess }: Props) {
  const { t } = useLocale()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [pickupCode, setPickupCode] = useState('')

  const artist = release.artists[0] ?? '—'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const name  = (form.get('customer_name')  as string ?? '').trim()
    const phone = (form.get('customer_phone') as string ?? '').trim()
    const email = (form.get('customer_email') as string ?? '').trim()

    if (!name)  { setError(t('pickup.nameRequired'));  setLoading(false); return }
    if (!phone) { setError(t('pickup.phoneRequired')); setLoading(false); return }
    if (!email) { setError(t('pickup.emailRequired')); setLoading(false); return }

    const phoneClean = phone.replace(/[\s\-\.]/g, '')
    if (!/^(\+34|0034)?[67]\d{8}$/.test(phoneClean)) { setError(t('pickup.phoneInvalid')); setLoading(false); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))   { setError(t('pickup.emailInvalid')); setLoading(false); return }

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ release_id: release.id, customer_name: name, customer_phone: phone, customer_email: email }),
      })
      const data = await res.json()
      if (res.ok) {
        setPickupCode(data.pickup_code || '')
        setDone(true)
        onSuccess()
      } else {
        // E2-1: Mensaje de error claro para status 409 (ya reservado)
        if (res.status === 409) {
          setError('Este disco ya ha sido reservado por otra persona. Vuelve más tarde para comprobar disponibilidad.')
        } else {
          setError(data.error ?? 'Error al crear la reserva')
        }
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 300 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm p-6" style={{ backgroundColor: '#000', border: '2px solid #FFF' }}>

        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-display text-xs mb-1" style={{ color: '#F0E040' }}>CLICK & COLLECT</p>
            <p className="font-display text-sm" style={{ color: '#FFF' }}>{artist}</p>
            <p className="font-display text-sm" style={{ color: '#F0E040' }}>{release.title}</p>
          </div>
          <button onClick={onClose} className="font-display text-sm ml-4 flex items-center justify-center"
            style={{ color: '#FFF', minWidth: '44px', minHeight: '44px' }}>✕</button>
        </div>

        {done ? (
          <div className="text-center py-4">
            <p className="font-display text-base mb-2" style={{ color: '#F0E040' }}>{t('pickup.success')}</p>
            {pickupCode && (
              <div className="mb-4 p-4" style={{ border: '2px solid #F0E040', backgroundColor: 'rgba(240, 224, 64, 0.08)' }}>
                <p className="font-meta text-xs mb-1" style={{ color: '#FFF' }}>{t('pickup.yourCode')}</p>
                <p className="font-display text-2xl" style={{ color: '#F0E040', letterSpacing: '0.15em' }}>{pickupCode}</p>
              </div>
            )}
            <p className="font-meta text-xs leading-relaxed mb-2" style={{ color: '#FFFFFF' }}>{t('pickup.emailSent')}</p>
            <p className="font-meta text-xs leading-relaxed" style={{ color: '#999999' }}>{t('pickup.expiresIn')}</p>
            <button onClick={onClose} className="w-full font-display text-xs mt-6"
              style={{ backgroundColor: '#FFF', color: '#000', minHeight: '44px' }}>{t('btn.close')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="font-meta text-xs" style={{ color: '#999999' }}>{t('pickup.description')}</p>

            <div>
              <label className="font-meta text-xs block mb-1" style={{ color: '#FFFFFF' }}>{t('pickup.name')} *</label>
              <input name="customer_name" required
                autoComplete="name" inputMode="text"
                className="w-full bg-transparent font-meta text-sm focus:outline-none"
                style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                placeholder="Tu nombre completo" />
            </div>

            <div>
              <label className="font-meta text-xs block mb-1" style={{ color: '#FFFFFF' }}>{t('pickup.phone')} *</label>
              <input name="customer_phone" type="tel" required
                autoComplete="tel" inputMode="tel"
                className="w-full bg-transparent font-meta text-sm focus:outline-none"
                style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                placeholder="+34 6XX XXX XXX" />
            </div>

            <div>
              <label className="font-meta text-xs block mb-1" style={{ color: '#FFFFFF' }}>{t('pickup.email')} *</label>
              <input name="customer_email" type="email" required
                autoComplete="email" inputMode="email"
                className="w-full bg-transparent font-meta text-sm focus:outline-none"
                style={{ border: '1px solid #333', color: '#FFF', padding: '12px' }}
                placeholder="tu@email.com" />
              <p className="font-meta text-xs mt-1" style={{ color: '#666' }}>{t('pickup.sendCode')}</p>
            </div>

            {error && <p className="font-meta text-xs" style={{ color: '#ef4444' }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full font-display text-sm mt-1 transition-colors"
              style={{ backgroundColor: '#F0E040', color: '#000', opacity: loading ? 0.6 : 1, minHeight: '44px' }}>
              {loading ? t('pickup.submitting') : t('pickup.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
