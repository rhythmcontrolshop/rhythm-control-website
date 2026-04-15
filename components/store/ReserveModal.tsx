'use client'
import { useState } from 'react'
import type { Release } from '@/types'
interface Props { release: Release; onClose: () => void; onSuccess: () => void }
export default function ReserveModal({ release, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')
  const artist = release.artists[0] ?? '—'
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError('')
    const form = new FormData(e.currentTarget)
    const phone = (form.get('customer_phone') as string ?? '').trim()
    const phoneClean = phone.replace(/[\s\-\.]/g, '')
    const isSpanish = /^(\+34|0034)?[67]\d{8}$/.test(phoneClean)
    if (!isSpanish) {
      setError('Introduce un teléfono español válido (+34 6XX o 7XX XXX XXX). Las reservas son solo para recogida en tienda.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ release_id: release.id,
        customer_name:  form.get('customer_name'),
        customer_phone: form.get('customer_phone'),
        customer_email: form.get('customer_email') || undefined }),
    })
    if (res.ok) { setDone(true); onSuccess() }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Error al crear la reserva') }
    setLoading(false)
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 300 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm p-6" style={{ backgroundColor: '#000', border: '2px solid #FFF' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-display text-xs mb-1" style={{ color: '#FFFFFF' }}>RESERVAR DISCO</p>
            <p className="font-display text-sm" style={{ color: '#FFF' }}>{artist}</p>
            <p className="font-display text-sm" style={{ color: '#F0E040' }}>{release.title}</p>
          </div>
          <button onClick={onClose} className="font-display text-sm ml-4" style={{ color: '#FFF' }}>✕</button>
        </div>
        {done ? (
          <div className="text-center py-4">
            <p className="font-display text-base mb-3" style={{ color: '#F0E040' }}>RESERVA CREADA</p>
            <p className="font-meta text-xs leading-relaxed" style={{ color: '#FFFFFF' }}>
              El disco queda reservado 24 horas.<br />Nuestro equipo te contactará por teléfono.
            </p>
            <button onClick={onClose} className="w-full font-display text-xs py-3 mt-6"
              style={{ backgroundColor: '#FFF', color: '#000' }}>CERRAR</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="font-meta text-xs" style={{ color: '#FFFFFF' }}>
              La reserva dura 24 h. Si no se confirma, el disco vuelve al catálogo.
            </p>
            <div>
              <label className="font-meta text-xs block mb-1" style={{ color: '#FFFFFF' }}>NOMBRE *</label>
              <input name="customer_name" required
                className="w-full bg-transparent font-meta text-sm px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #333', color: '#FFF' }} placeholder="Tu nombre completo" />
            </div>
            <div>
              <label className="font-meta text-xs block mb-1" style={{ color: '#FFFFFF' }}>TELÉFONO *</label>
              <input name="customer_phone" type="tel" required
                className="w-full bg-transparent font-meta text-sm px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #333', color: '#FFF' }} placeholder="+34 6XX XXX XXX" />
            </div>
            <div>
              <label className="font-meta text-xs block mb-1" style={{ color: '#FFFFFF' }}>EMAIL (opcional)</label>
              <input name="customer_email" type="email"
                className="w-full bg-transparent font-meta text-sm px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #333', color: '#FFF' }} placeholder="tu@email.com" />
            </div>
            {error && <p className="font-meta text-xs" style={{ color: '#ef4444' }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full font-display text-sm py-3 mt-1"
              style={{ backgroundColor: '#FFF', color: '#000', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'RESERVANDO...' : 'CONFIRMAR RESERVA'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
