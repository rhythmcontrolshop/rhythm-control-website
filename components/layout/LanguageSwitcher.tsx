'use client'

import { useLocale } from '@/context/LocaleContext'

export default function LanguageSwitcher() {
  const { locale, setLocale, locales } = useLocale()

  return (
    <div className="flex items-center gap-1">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && (
            <span className="text-xs mx-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
          )}
          <button
            onClick={() => setLocale(l)}
            className="font-display text-xs uppercase transition-colors"
            style={{
              color: locale === l ? '#F0E040' : '#FFFFFF',
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
