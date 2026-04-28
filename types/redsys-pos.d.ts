declare module 'redsys-pos' {
  interface PaymentParameters {
    amount: string
    orderReference: string
    merchantName?: string
    merchantCode: string
    currency?: string
    transactionType: string
    terminal?: string
    merchantURL?: string
    successURL?: string
    errorURL?: string
  }

  interface PaymentResult {
    Ds_SignatureVersion: string
    Ds_MerchantParameters: string
    Ds_Signature: string
  }

  interface ResponseParameters {
    Ds_Date: string
    Ds_Hour: string
    Ds_SecurePayment: string
    Ds_Amount: string
    Ds_Currency: string
    Ds_Order: string
    Ds_MerchantCode: string
    Ds_Terminal: string
    Ds_Response: string
    Ds_TransactionType: string
    Ds_MerchantData: string
    Ds_AuthorisationCode: string
    Ds_ConsumerLanguage: string
    [key: string]: string
  }

  class RedSys {
    constructor(merchantSecretKey: string)
    makePaymentParameters(params: PaymentParameters): PaymentResult
    checkResponseParameters(strPayload: string, givenSignature: string): ResponseParameters | null
  }

  namespace RedSys {
    export const CURRENCIES: { EUR: string; USD: string; GBP: string; JPY: string; RUB: string }
    export const TRANSACTION_TYPES: { AUTHORIZATION: string; PRE_AUTHORIZATION: string; CONFIRMATION: string; AUTO_REFUND: string }
    export function getResponseCodeMessage(code: string): string | null
  }

  export = RedSys
}
