// lib/redsys/index.ts
// Integración con Redsys TPV Virtual — reemplaza Stripe
// Usa el paquete redsys-pos para firmar solicitudes y verificar respuestas

import RedSys from 'redsys-pos'

// ─── Configuración ──────────────────────────────────────────────────────────

function getRedsysConfig() {
  const merchantCode = process.env.REDSYS_MERCHANT_CODE
  const terminal = process.env.REDSYS_TERMINAL ?? '1'
  const merchantKey = process.env.REDSYS_MERCHANT_KEY
  const isSandbox = process.env.REDSYS_SANDBOX === 'true'

  if (!merchantCode || !merchantKey) {
    throw new Error('REDSYS_MERCHANT_CODE y REDSYS_MERCHANT_KEY deben estar configurados')
  }

  return { merchantCode, terminal, merchantKey, isSandbox }
}

// URL del TPV según entorno
export function getRedsysUrl(): string {
  const { isSandbox } = getRedsysConfig()
  return isSandbox
    ? 'https://sis-t.redsys.es:25443/sis/realizarPago'
    : 'https://sis.redsys.es/sis/realizarPago'
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface RedsysPaymentParams {
  amount: number            // Importe en céntimos de euro (ej: 1550 = 15.50€)
  orderReference: string    // 4-12 caracteres, los 4 primeros numéricos (ej: "202600001")
  merchantName?: string
  successURL: string
  errorURL: string
  merchantURL: string       // IPN notification URL
  currency?: string         // ISO 4217 numérico, por defecto EUR (978)
  transactionType?: string  // Por defecto '0' (autorización)
  payMethod?: 'card' | 'bizum' | 'all'  // Método de pago
}

export interface RedsysFormParams {
  Ds_SignatureVersion: string
  Ds_MerchantParameters: string
  Ds_Signature: string
  action: string  // URL del TPV
}

export interface RedsysResponse {
  Ds_Date?: string
  Ds_Hour?: string
  Ds_SecurePayment?: string
  Ds_Amount?: string           // En céntimos
  Ds_Currency?: string
  Ds_Order?: string            // Número de orden en Redsys
  Ds_MerchantCode?: string
  Ds_Terminal?: string
  Ds_Response?: string         // Código de respuesta (000-002 = OK)
  Ds_TransactionType?: string
  Ds_MerchantData?: string
  Ds_AuthorisationCode?: string
  Ds_ConsumerLanguage?: string
  Ds_CardNumber?: string       // Tarjeta enmascarada
  Ds_Card_Country?: string
  Ds_ChallengeName?: string    // Para 3D Secure
  Ds_PaymentMethod?: string    // Método de pago usado
  Ds_ProcessedPayMethod?: string
}

// ─── Crear parámetros de pago ──────────────────────────────────────────────

export function createPaymentParameters(params: RedsysPaymentParams): RedsysFormParams {
  const { merchantCode, terminal, merchantKey } = getRedsysConfig()
  const redsys = new RedSys(merchantKey)

  const paymentParams = redsys.makePaymentParameters({
    amount: String(params.amount),
    orderReference: params.orderReference,
    merchantName: params.merchantName ?? 'RHYTHM CONTROL',
    merchantCode,
    currency: params.currency ?? '978',  // EUR
    transactionType: params.transactionType ?? '0',
    terminal,
    merchantURL: params.merchantURL,
    successURL: params.successURL,
    errorURL: params.errorURL,
  })

  return {
    Ds_SignatureVersion: paymentParams.Ds_SignatureVersion,
    Ds_MerchantParameters: paymentParams.Ds_MerchantParameters,
    Ds_Signature: paymentParams.Ds_Signature,
    action: getRedsysUrl(),
  }
}

// ─── Verificar respuesta de Redsys ─────────────────────────────────────────

export function verifyResponseParameters(
  merchantParams: string,
  signature: string
): RedsysResponse | null {
  const { merchantKey } = getRedsysConfig()
  const redsys = new RedSys(merchantKey)

  try {
    const result = redsys.checkResponseParameters(merchantParams, signature)
    if (!result) return null
    return result as unknown as RedsysResponse
  } catch (err) {
    console.error('Redsys response verification failed:', err)
    return null
  }
}

// ─── Interpretar código de respuesta ───────────────────────────────────────

export function isPaymentSuccessful(dsResponse: string): boolean {
  // Códigos 000-099 = transacción autorizada
  const code = parseInt(dsResponse, 10)
  return code >= 0 && code <= 99
}

export function getResponseMessage(dsResponse: string): string | null {
  return RedSys.getResponseCodeMessage(dsResponse)
}

// ─── Generar orderReference ────────────────────────────────────────────────

// Redsys requiere 4-12 caracteres, los 4 primeros numéricos
// Usamos formato: YYYY + secuencia (ej: "202600001")
export function generateRedsysOrderReference(orderNumber: string): string {
  const match = orderNumber.match(/RC-(\d+)/)
  const seq = match ? match[1] : '00001'
  const year = new Date().getFullYear().toString()
  return `${year}${seq}`
}

// Convertir céntimos a euros
export function centsToEuros(cents: number): number {
  return Math.round(cents) / 100
}

// Convertir euros a céntimos
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

// ─── Modo sandbox ──────────────────────────────────────────────────────────

export function isRedsysSandbox(): boolean {
  return process.env.REDSYS_SANDBOX === 'true'
}
