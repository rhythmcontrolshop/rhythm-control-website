'use client'
// E3-13: Touch padding for language buttons (min 44px touch target)

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
          {/* E3-13: min 44px touch target via py-2 px-1 */}
          <button
            onClick={() => setLocale(l)}
            className="font-display text-xs uppercase transition-colors py-2 px-1"
            style={{
              color: locale === l ? '#F0E040' : '#FFFFFF',
              fontWeight: locale === l ? 700 : 400,
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  )
}
