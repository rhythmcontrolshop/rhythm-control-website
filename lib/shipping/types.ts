// lib/shipping/types.ts
// Tipos unificados para envíos

export interface ShippingAddress {
  // TIPSA usa contact_name (nombre completo)
  // Packlink usa name + surname (separados)
  firstName: string
  lastName: string
  fullName: string  // = firstName + lastName (para TIPSA)
  phone: string
  email: string
  address: string
  postalCode: string
  city: string
  province?: string  // Código provincia (solo España)
  countryCode: string  // ISO 2 letras: ES, PT, FR...
}

export interface Parcel {
  weight: number  // kg
  length?: number // cm
  width?: number  // cm
  height?: number // cm
  content?: string
  value?: number  // euros
}

export interface ShipmentPayload {
  sender: ShippingAddress
  receiver: ShippingAddress
  parcels: Parcel[]
  reference?: string
}
