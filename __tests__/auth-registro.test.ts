import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const { mockSignUp, mockExchangeCode } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  mockExchangeCode: vi.fn(),
}))

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signUp: mockSignUp,
        exchangeCodeForSession: mockExchangeCode,
        resend: vi.fn(() => Promise.resolve({ error: null })),
      },
    })
  ),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`__REDIRECT__${url}`)
  }),
  revalidatePath: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/resend', () => ({
  sendWelcomeEmail: vi.fn(() => Promise.resolve()),
}))

// ─── Subject imports ──────────────────────────────────────────────────────────

import { GET } from '@/app/auth/callback/route'
import { registerCustomer } from '@/app/registro/actions'

// ─── Test helpers ─────────────────────────────────────────────────────────────

async function getRedirectUrl(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn()
    throw new Error('Expected a redirect but none occurred')
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith('__REDIRECT__')) {
      return e.message.slice('__REDIRECT__'.length)
    }
    throw e
  }
}

function fd(fields: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}

// ─── GET /auth/callback — PKCE handler ────────────────────────────────────────

describe('GET /auth/callback', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /registro/confirmado on successful code exchange', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })
    const res = await GET(new Request('http://localhost/auth/callback?code=abc123'))
    expect(res.headers.get('location')).toBe('http://localhost/registro/confirmado')
  })

  it('redirects to /admin/reset-password when type=recovery', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })
    const res = await GET(new Request('http://localhost/auth/callback?code=abc123&type=recovery'))
    expect(res.headers.get('location')).toBe('http://localhost/admin/reset-password')
  })

  it('redirects to /registro?error=callback-failed when no code is present', async () => {
    const res = await GET(new Request('http://localhost/auth/callback'))
    expect(res.headers.get('location')).toBe('http://localhost/registro?error=callback-failed')
  })

  it('redirects to /registro?error=callback-failed when code exchange returns an error', async () => {
    mockExchangeCode.mockResolvedValue({ error: new Error('invalid_grant') })
    const res = await GET(new Request('http://localhost/auth/callback?code=bad'))
    expect(res.headers.get('location')).toBe('http://localhost/registro?error=callback-failed')
  })
})

// ─── registerCustomer server action ──────────────────────────────────────────

describe('registerCustomer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /registro/pendiente when email confirmation is required', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { email_confirmed_at: null } },
      error: null,
    })
    const url = await getRedirectUrl(() =>
      registerCustomer(fd({ email: 'user@example.com', password: 'Password1' }))
    )
    expect(url).toMatch(/^\/registro\/pendiente\?email=/)
    expect(decodeURIComponent(url)).toContain('user@example.com')
  })

  it('redirects to /cuenta?welcome=true when email is auto-confirmed', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { email_confirmed_at: '2024-01-01T00:00:00.000Z' } },
      error: null,
    })
    const url = await getRedirectUrl(() =>
      registerCustomer(fd({ email: 'user@example.com', password: 'Password1' }))
    )
    expect(url).toBe('/cuenta?welcome=true')
  })

  it('redirects to /registro?error=password-corto for passwords shorter than 8 chars', async () => {
    const url = await getRedirectUrl(() =>
      registerCustomer(fd({ email: 'user@example.com', password: 'P1' }))
    )
    expect(url).toBe('/registro?error=password-corto')
  })

  it('redirects to /registro?error=password-debil for passwords missing uppercase', async () => {
    const url = await getRedirectUrl(() =>
      registerCustomer(fd({ email: 'user@example.com', password: 'password123' }))
    )
    expect(url).toBe('/registro?error=password-debil')
  })

  it('redirects to /registro?error=password-debil for passwords missing a digit', async () => {
    const url = await getRedirectUrl(() =>
      registerCustomer(fd({ email: 'user@example.com', password: 'PasswordOnly' }))
    )
    expect(url).toBe('/registro?error=password-debil')
  })

  it('redirects to /registro?error=email-existe when the address is already registered', async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    })
    const url = await getRedirectUrl(() =>
      registerCustomer(fd({ email: 'taken@example.com', password: 'Password1' }))
    )
    expect(url).toBe('/registro?error=email-existe')
  })

  it('redirects to /registro?error=campos-requeridos when email is empty', async () => {
    const url = await getRedirectUrl(() =>
      registerCustomer(fd({ email: '', password: 'Password1' }))
    )
    expect(url).toBe('/registro?error=campos-requeridos')
  })
})
