'use client'
import { useState } from 'react'
import { useLocale } from '@/context/LocaleContext'

export default function ContactForm() {
  const { t } = useLocale()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    // E2-4: Real API call instead of mock setTimeout
    try {
      const form = e.target as HTMLFormElement
      const name = (form.elements.namedItem('name') as HTMLInputElement)?.value ?? ''
      const email = (form.elements.namedItem('email') as HTMLInputElement)?.value ?? ''
      const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value ?? ''

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      if (res.ok) {
        setStatus('sent')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="p-6 border-2 border-black text-center bg-white">
        <p className="font-display text-lg" style={{ color: '#000000' }}>{t('contact.sent')}</p>
        <p className="font-meta text-xs mt-2" style={{ color: '#000000' }}>{t('contact.willReply')}</p>
        <button onClick={() => setStatus('idle')} className="font-display text-xs mt-4 underline" style={{ color: '#000000' }}>{t('contact.sendAnother')}</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="font-display text-xs block mb-1" style={{ color: '#000000' }}>{t('contact.name')}</label>
        <input name="name" type="text" required autoComplete="name" inputMode="text"
          className="w-full p-2 border-2 border-black font-mono text-xs focus:outline-none focus:bg-[#F0E040] text-black" />
      </div>
      <div>
        <label className="font-display text-xs block mb-1" style={{ color: '#000000' }}>{t('auth.email')}</label>
        <input name="email" type="email" required autoComplete="email" inputMode="email"
          className="w-full p-2 border-2 border-black font-mono text-xs focus:outline-none focus:bg-[#F0E040] text-black" />
      </div>
      <div>
        <label className="font-display text-xs block mb-1" style={{ color: '#000000' }}>{t('contact.message')}</label>
        <textarea name="message" required rows={4}
          className="w-full p-2 border-2 border-black font-mono text-xs focus:outline-none focus:bg-[#F0E040] resize-none text-black"></textarea>
      </div>
      {status === 'error' && (
        <p className="font-meta text-xs" style={{ color: '#ef4444' }}>Error al enviar. Inténtalo de nuevo.</p>
      )}
      <button type="submit" disabled={status === 'sending'} className="font-display text-xs py-3 bg-black text-white hover:bg-[#F0E040] hover:text-black transition-colors disabled:opacity-50">
        {status === 'sending' ? t('contact.sending') : t('contact.send')}
      </button>
    </form>
  )
}
