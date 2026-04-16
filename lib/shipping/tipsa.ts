// lib/shipping/tipsa.ts
// Generador de payload para TIPSA (vía AfterShip o directo)

import type { ShippingAddress, Parcel, ShipmentPayload } from './types'

interface TIPSAAddress {
  contact_name: string
  phone: string
  email: string
  street1: string
  city: string
  postal_code: string
  country: string  // 3 letras: ESP, PRT, FRA...
}

interface TIPSAShipment {
  billing: {
    paid_by: 'shipper' | 'recipient' | 'third_party'
  }
  ship_from: TIPSAAddress
  ship_to: TIPSAAddress
  parcels: Array<{
    weight: { value: number; unit: 'kg' }
  }>
  reference?: string
}

// Convertir código ISO 2 a 3 letras
const ISO2_TO_ISO3: Record<string, string> = {
  ES: 'ESP',
  PT: 'PRT',
  FR: 'FRA',
  DE: 'DEU',
  IT: 'ITA',
  GB: 'GBR',
  NL: 'NLD',
  BE: 'BEL',
  AT: 'AUT',
  CH: 'CHE',
}

export function buildTIPSAPayload(
  sender: ShippingAddress,
  receiver: ShippingAddress,
  parcels: Parcel[],
  reference?: string
): TIPSAShipment {
  return {
    billing: { paid_by: 'shipper' },
    ship_from: {
      contact_name: sender.fullName,
      phone: sender.phone,
      email: sender.email,
      street1: sender.address,
      city: sender.city,
      postal_code: sender.postalCode,
      country: ISO2_TO_ISO3[sender.countryCode] || sender.countryCode,
    },
    ship_to: {
      contact_name: receiver.fullName,
      phone: receiver.phone,
      email: receiver.email,
      street1: receiver.address,
      city: receiver.city,
      postal_code: receiver.postalCode,
      country: ISO2_TO_ISO3[receiver.countryCode] || receiver.countryCode,
    },
    parcels: parcels.map(p => ({
      weight: { value: p.weight, unit: 'kg' as const }
    })),
    reference,
  }
}
