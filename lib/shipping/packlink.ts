// lib/shipping/packlink.ts
// Generador de payload para Packlink PRO

import type { ShippingAddress, Parcel } from './types'

interface PacklinkAddress {
  name: string
  surname: string
  email: string
  phone: string
  address: string
  postal_code: string
  city: string
  country: string  // ISO 2 letras
}

interface PacklinkShipment {
  sender: PacklinkAddress
  receiver: PacklinkAddress
  parcels: Array<{
    weight: number
    length?: number
    width?: number
    height?: number
    content?: string
    value?: number
  }>
  reference?: string
}

export function buildPacklinkPayload(
  sender: ShippingAddress,
  receiver: ShippingAddress,
  parcels: Parcel[],
  reference?: string
): PacklinkShipment {
  return {
    sender: {
      name: sender.firstName,
      surname: sender.lastName,
      email: sender.email,
      phone: sender.phone,
      address: sender.address,
      postal_code: sender.postalCode,
      city: sender.city,
      country: sender.countryCode,
    },
    receiver: {
      name: receiver.firstName,
      surname: receiver.lastName,
      email: receiver.email,
      phone: receiver.phone,
      address: receiver.address,
      postal_code: receiver.postalCode,
      city: receiver.city,
      country: receiver.countryCode,
    },
    parcels: parcels.map(p => ({
      weight: p.weight,
      length: p.length,
      width: p.width,
      height: p.height,
      content: p.content,
      value: p.value,
    })),
    reference,
  }
}
