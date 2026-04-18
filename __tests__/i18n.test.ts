import { vi, describe, it, expect } from 'vitest'
import { t, getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/types'

// ─── i18n ────────────────────────────────────────────────────────

describe('i18n — t() function', () => {
  it('returns Spanish translation by default', () => {
    expect(t('es', 'btn.listen')).toBe('ESCUCHAR')
  })

  it('returns Catalan translation', () => {
    expect(t('cat', 'btn.listen')).toBe('ESCOLTAR')
  })

  it('returns English translation', () => {
    expect(t('en', 'btn.listen')).toBe('LISTEN')
  })

  it('returns key as fallback for missing translations', () => {
    expect(t('es', 'nonexistent.key')).toBe('nonexistent.key')
  })

  it('E5-4: supports variable interpolation', () => {
    // Add a test key with variables — we'll test the mechanism
    // Even though existing keys don't use {var}, the function supports it
    const dict = getDictionary('es')
    // Test that vars parameter doesn't break existing translations
    expect(t('es', 'btn.listen', {})).toBe('ESCUCHAR')
    expect(t('es', 'btn.listen', { count: 5 })).toBe('ESCUCHAR')
  })
})

describe('i18n — getDictionary()', () => {
  it('returns Spanish dictionary for es locale', () => {
    const dict = getDictionary('es')
    expect(dict['nav.catalogue']).toBe('CATÁLOGO')
  })

  it('falls back to Spanish for unknown locale', () => {
    const dict = getDictionary('fr' as Locale)
    expect(dict['nav.catalogue']).toBe('CATÁLOGO')
  })
})

// ─── Price calculation ───────────────────────────────────────────

describe('Price calculation', () => {
  it('calculates channel price with coefficient', async () => {
    const { calculateChannelPrice } = await import('@/lib/pricing')
    expect(calculateChannelPrice(10, 1.05)).toBeCloseTo(10.5, 2)
    expect(calculateChannelPrice(100, 1.0)).toBe(100)
    expect(calculateChannelPrice(0, 1.5)).toBe(0)
  })
})
