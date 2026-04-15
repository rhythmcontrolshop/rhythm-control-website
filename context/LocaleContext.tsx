'use client'
// context/LocaleContext.tsx
// Contexto de locale para el sistema i18n

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { t, DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, LOCALE_FLAGS } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  locales: Locale[]
  localeLabels: Record<Locale, string>
  localeFlags: Record<Locale, string>
}

const LocaleContext = createContext<LocaleContextType | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE
    const saved = localStorage.getItem('rc-locale') as Locale | null
    if (saved && LOCALES.includes(saved)) return saved
    return DEFAULT_LOCALE
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rc-locale', newLocale)
    }
  }, [])

  const translate = useCallback((key: string) => t(locale, key), [locale])

  return (
    <LocaleContext.Provider value={{
      locale,
      setLocale,
      t: translate,
      locales: LOCALES,
      localeLabels: LOCALE_LABELS,
      localeFlags: LOCALE_FLAGS,
    }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    // Fallback para cuando no hay provider (SSR o fuera del provider)
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string) => t(DEFAULT_LOCALE, key),
      locales: LOCALES,
      localeLabels: LOCALE_LABELS,
      localeFlags: LOCALE_FLAGS,
    }
  }
  return context
}
