// lib/i18n/types.ts
// Tipos para el sistema de internacionalización

export type Locale = 'cat' | 'es' | 'en'

export const LOCALES: Locale[] = ['cat', 'es', 'en']
export const DEFAULT_LOCALE: Locale = 'es'

export const LOCALE_LABELS: Record<Locale, string> = {
  cat: 'Català',
  es:  'Castellano',
  en:  'English',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  cat: '🇪🇺',
  es:  '🇪🇸',
  en:  '🇬🇧',
}
