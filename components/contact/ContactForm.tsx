'use client'
import { useState } from 'react'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    await new Promise(r => setTimeout(r, 1000))
    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="p-6 border-2 border-black text-center bg-white">
        <p className="font-display text-lg" style={{ color: '#000000' }}>MENSAJE ENVIADO</p>
        <p className="font-meta text-xs mt-2" style={{ color: '#000000' }}>Te responderemos lo antes posible.</p>
        <button onClick={() => setStatus('idle')} className="font-display text-xs mt-4 underline" style={{ color: '#000000' }}>ENVIAR OTRO</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="font-display text-xs block mb-1" style={{ color: '#000000' }}>NOMBRE</label>
        <input type="text" required className="w-full p-2 border-2 border-black font-mono text-xs focus:outline-none focus:bg-[#F0E040] text-black" />
      </div>
      <div>
        <label className="font-display text-xs block mb-1" style={{ color: '#000000' }}>EMAIL</label>
        <input type="email" required className="w-full p-2 border-2 border-black font-mono text-xs focus:outline-none focus:bg-[#F0E040] text-black" />
      </div>
      <div>
        <label className="font-display text-xs block mb-1" style={{ color: '#000000' }}>MENSAJE</label>
        <textarea required rows={4} className="w-full p-2 border-2 border-black font-mono text-xs focus:outline-none focus:bg-[#F0E040] resize-none text-black"></textarea>
      </div>
      <button type="submit" disabled={status === 'sending'} className="font-display text-xs py-3 bg-black text-white hover:bg-[#F0E040] hover:text-black transition-colors disabled:opacity-50">
        {status === 'sending' ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
      </button>
    </form>
  )
}
