import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── requireAdmin ─────────────────────────────────────────────────

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null })),
          })),
        })),
      })),
    })
  ),
}))

describe('requireAdmin — auth check', () => {
  it('returns 401 when no user is logged in', async () => {
    const { requireAdmin } = await import('@/lib/supabase/require-admin')
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })
})
