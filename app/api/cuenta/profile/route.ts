import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

function validatePhone(phone: string): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '')
  
  if (/^[6789]\d{8}$/.test(cleaned)) {
    return `+34${cleaned}`
  }
  
  if (/^\+\d{7,15}$/.test(cleaned)) {
    return cleaned
  }
  
  return null
}

function validatePostalCode(code: string, countryCode: string): boolean {
  if (!code) return true
  
  const patterns: Record<string, RegExp> = {
    ES: /^\d{5}$/, PT: /^\d{4}(-\d{3})?$/, FR: /^\d{5}$/,
    DE: /^\d{5}$/, IT: /^\d{5}$/, GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i
  }
  
  return patterns[countryCode]?.test(code) ?? true
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  console.log('PATCH /api/cuenta/profile - user:', user?.id)
  
  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  console.log('PATCH body:', JSON.stringify(body, null, 2))
  
  const { section, ...fields } = body

  const updateData: Record<string, any> = {}
  
  if (section === 'personal') {
    if (fields.username !== undefined) updateData.username = fields.username?.trim() || null
    if (fields.first_name !== undefined) updateData.first_name = fields.first_name?.trim() || null
    if (fields.last_name !== undefined) updateData.last_name = fields.last_name?.trim() || null
    if (fields.nif !== undefined) updateData.tax_id = fields.nif?.trim().toUpperCase() || null
    
    if (fields.first_name || fields.last_name) {
      const parts = [fields.first_name, fields.last_name].filter(Boolean)
      if (parts.length > 0) updateData.full_name = parts.join(' ')
    }
    
  } else if (section === 'shipping') {
    if (fields.phone) {
      const validatedPhone = validatePhone(fields.phone)
      if (!validatedPhone) {
        return Response.json({ error: 'Teléfono inválido. Usa: +34600123456 o 600123456' }, { status: 400 })
      }
      updateData.phone = validatedPhone
    } else {
      updateData.phone = null
    }
    
    const countryCode = fields.country_code || 'ES'
    if (fields.postal_code && !validatePostalCode(fields.postal_code, countryCode)) {
      return Response.json({ error: 'Código postal inválido' }, { status: 400 })
    }
    
    updateData.address = fields.address?.trim() || null
    updateData.postal_code = fields.postal_code?.trim() || null
    updateData.city = fields.city?.trim() || null
    updateData.province = countryCode === 'ES' ? fields.province : null
    updateData.country_code = countryCode
  }

  console.log('updateData:', JSON.stringify(updateData, null, 2))

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()

  if (error) {
    console.error('Supabase error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  console.log('Updated successfully:', data)
  return Response.json({ ok: true })
}
