'use client'
// components/layout/LanguageSwitcher.tsx
// Selector de idioma minimalista para la navegación

import { useLocale } from '@/context/LocaleContext'

export default function LanguageSwitcher() {
  const { locale, setLocale, locales } = useLocale()

  return (
    <div className="flex items-center gap-1">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && (
            <span className="text-xs mx-0.5" style={{ color: '#666' }}>/</span>
          )}
          <button
            onClick={() => setLocale(l)}
            className="text-xs transition-colors uppercase"
            style={{
              color: locale === l ? '#F0E040' : '#999',
              fontWeight: locale === l ? 700 : 400,
            }}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  )
}
