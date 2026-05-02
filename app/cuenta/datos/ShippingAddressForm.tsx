'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  phone?: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
  province?: string | null
  country_code?: string | null
}

const PROVINCES_ES: Record<string, string> = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería',
  '05': 'Ávila', '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona',
  '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón',
  '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16': 'Cuenca',
  '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Guipúzcoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León',
  '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid',
  '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
  '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra',
  '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria',
  '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona',
  '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid',
  '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'
}

const COUNTRIES: Record<string, string> = {
  ES: 'España', PT: 'Portugal', FR: 'Francia', IT: 'Italia',
  DE: 'Alemania', GB: 'Reino Unido', NL: 'Países Bajos',
  BE: 'Bélgica', AT: 'Austria', IE: 'Irlanda'
}

function validatePhone(phone: string): { valid: boolean; formatted: string; error?: string } {
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '')
  
  if (cleaned.startsWith('+34')) {
    const num = cleaned.slice(3)
    if (/^[6789]\d{8}$/.test(num)) {
      return { valid: true, formatted: `+34${num}` }
    }
    return { valid: false, formatted: phone, error: 'Teléfono español inválido' }
  }
  
  if (/^[6789]\d{8}$/.test(cleaned)) {
    return { valid: true, formatted: `+34${cleaned}` }
  }
  
  if (/^\+\d{7,15}$/.test(cleaned)) {
    return { valid: true, formatted: cleaned }
  }
  
  return { valid: false, formatted: phone, error: 'Formato: +34600123456 o 600123456' }
}

function validatePostalCode(code: string, countryCode: string): { valid: boolean; error?: string } {
  const patterns: Record<string, RegExp> = {
    ES: /^\d{5}$/,
    PT: /^\d{4}(-\d{3})?$/,
    FR: /^\d{5}$/,
    DE: /^\d{5}$/,
    IT: /^\d{5}$/,
    GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    NL: /^\d{4}[A-Z]{2}$/i,
    BE: /^\d{4}$/,
    AT: /^\d{4}$/,
    IE: /^[A-Z]\d{2}[A-Z]{0,2}$/i
  }
  
  const pattern = patterns[countryCode]
  if (!pattern) return { valid: true }
  
  if (!pattern.test(code)) {
    return { valid: false, error: `Código postal inválido para ${COUNTRIES[countryCode] || countryCode}` }
  }
  return { valid: true }
}

export default function ShippingAddressForm({ profile }: { profile: Profile | null }) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setApiError(null)
    setErrors({})

    const form = new FormData(e.currentTarget)
    const phone = form.get('phone') as string
    const postalCode = form.get('postal_code') as string
    const countryCode = form.get('country_code') as string

    const newErrors: Record<string, string> = {}
    
    if (phone) {
      const phoneResult = validatePhone(phone)
      if (!phoneResult.valid) newErrors.phone = phoneResult.error!
    }
    
    if (postalCode) {
      const cpResult = validatePostalCode(postalCode, countryCode)
      if (!cpResult.valid) newErrors.postal_code = cpResult.error!
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    const formattedPhone = phone ? validatePhone(phone).formatted : null

    try {
      const res = await fetch('/api/cuenta/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'shipping',
          phone: formattedPhone,
          address: form.get('address'),
          postal_code: form.get('postal_code'),
          city: form.get('city'),
          province: countryCode === 'ES' ? form.get('province') : null,
          country_code: countryCode
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setApiError(data.error || 'Error al guardar')
        setLoading(false)
        return
      }

      setSaved(true)
      router.refresh()
    } catch (err) {
      setApiError('Error de conexión')
    }
    
    setLoading(false)
  }

  const currentCountry = profile?.country_code || 'ES'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            TELÉFONO
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={profile?.phone || ''}
            className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: `2px solid ${errors.phone ? '#ef4444' : '#FFFFFF'}`, color: '#FFFFFF' }}
            placeholder="+34 600 123 456"
          />
          {errors.phone && (
            <p className="font-meta text-xs mt-1" style={{ color: '#ef4444' }}>{errors.phone}</p>
          )}
        </div>
        
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            PAÍS
          </label>
          <select
            name="country_code"
            defaultValue={currentCountry}
            className="w-full bg-black font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
          >
            {Object.entries(COUNTRIES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
          DIRECCIÓN
        </label>
        <input
          name="address"
          type="text"
          defaultValue={profile?.address || ''}
          className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
          style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
          placeholder="Calle, número, piso, puerta"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            CÓDIGO POSTAL
          </label>
          <input
            name="postal_code"
            type="text"
            defaultValue={profile?.postal_code || ''}
            className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: `2px solid ${errors.postal_code ? '#ef4444' : '#FFFFFF'}`, color: '#FFFFFF' }}
            placeholder="08001"
          />
          {errors.postal_code && (
            <p className="font-meta text-xs mt-1" style={{ color: '#ef4444' }}>{errors.postal_code}</p>
          )}
        </div>
        
        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            CIUDAD
          </label>
          <input
            name="city"
            type="text"
            defaultValue={profile?.city || ''}
            className="w-full bg-transparent font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
            placeholder="Barcelona"
          />
        </div>

        <div>
          <label className="font-meta text-xs block mb-2" style={{ color: '#FFFFFF' }}>
            PROVINCIA
          </label>
          <select
            name="province"
            defaultValue={profile?.province || ''}
            className="w-full bg-black font-meta text-sm px-4 py-3 focus:outline-none"
            style={{ border: '2px solid #FFFFFF', color: '#FFFFFF' }}
          >
            <option value="">Seleccionar...</option>
            {Object.entries(PROVINCES_ES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {apiError && (
        <p className="font-meta text-xs" style={{ color: '#ef4444' }}>{apiError}</p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="font-display text-sm px-6 py-3 transition-colors duration-200"
          style={{ backgroundColor: '#FFFFFF', color: '#000000', border: '2px solid #000000', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#F0E040' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#FFFFFF' }}
        >
          {loading ? 'GUARDANDO...' : 'GUARDAR DIRECCIÓN'}
        </button>
        {saved && (
          <p className="font-meta text-xs" style={{ color: '#22c55e' }}>
            Dirección guardada
          </p>
        )}
      </div>
    </form>
  )
}
