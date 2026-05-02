# Harness: Quality Contract — Rhythm Control

## Formatting & Linting
formatter: none (project has no Prettier config — maintain existing style)
linter: ESLint (`eslint.config.mjs`) — run `bun run lint` before eval
type_check: TypeScript strict — run `bun run build` or `tsc --noEmit`
enforcement: eval gate (no pre-commit hooks configured)

## Testing Requirements
test_framework: Vitest (`vitest.config.ts`)
run_tests: `bun run test` or `bun vitest run`
unit_test_coverage: new functions with business logic must have at least 1 test
e2e: manual smoke test in staging (no Playwright suite)
new_api_routes: must be manually tested via curl or browser devtools

## Architecture Rules
- App Router only — no pages/ directory, no getServerSideProps
- Server Actions in `app/*/actions.ts` — use `'use server'` directive
- Client components only when interactivity required — use `'use client'`
- Auth always via `createClient()` (server) or `createClient()` (browser) from `@/lib/supabase/`
- Admin routes always protected by `requireAdminWithClient()` from `@/lib/supabase/require-admin`
- Rate limiting via `lib/rate-limit.ts` for all auth endpoints
- CSRF protection via `lib/csrf.ts` for all Server Actions that mutate state
- No direct Supabase calls in components — always through Server Actions or API routes
- `/auth/callback` must use PKCE: `supabase.auth.exchangeCodeForSession(code)` — never parse hash manually

## Code Principles
- Prefer composition over inheritance
- Explicit over implicit
- Functions do one thing
- No new CSS classes — use existing inline styles and Tailwind classes (see .tenet/DESIGN.md)
- No new npm packages without explicit user approval
- Error messages must be user-visible (not just console.error)
- `free_above` in shipping_rates: null = no free threshold (never default to 0)

## Danger Zones (do not modify)
- `lib/supabase/middleware.ts` — auth session refresh logic
- `middleware.ts` — route protection, rate limiting, CSRF, X-Request-ID
- `supabase/migrations/` — never edit existing migrations, only add new ones
- `lib/rate-limit.ts` — thresholds (10 auth/min, 5 reservations/hr)
- `app/api/webhooks/stripe/route.ts` — payment webhook
- `app/api/admin/seed/route.ts` — seed route
- `.env.local` — never commit, never log values

## Iron Laws
- Admin API routes MUST call `requireAdminWithClient()` — no exceptions
- Passwords hashed by Supabase Auth — never store plaintext or custom hashes
- `SUPABASE_SERVICE_ROLE_KEY` never in client bundle (no `NEXT_PUBLIC_` prefix)
- All redirects after auth actions must use `validateRedirectUrl()` from `lib/csrf.ts`
- `email_confirmed_at` check in registro: if null → `/registro/pendiente`, else → `/cuenta`
- PATCH `/api/admin/users` only updates allowed fields: `full_name`, `phone`, `address`, `city`, `postal_code` — never `role`, `email`, `id`

## Test Strategy (per layer)
- **Unit**: Vitest — test new utility functions (e.g., field validation, URL building)
- **Integration**: Manual — test API routes via browser devtools Network tab
- **E2E**: Manual smoke test — each auth flow executed once in staging with real credentials
- **Email delivery**: Manual — verify receipt in real inbox after domain verification
- **Admin auth**: Manual — verify 401 on unauthenticated requests to `/api/admin/*`

## Environment — Required Vars
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@rhythmcontrolbarcelona.com  # after DNS verification
NEXT_PUBLIC_SITE_URL=https://rhythmcontrolbarcelona.com
ADMIN_EMAIL=  # email for admin notifications
```

## Start Command
```
bun run dev   # localhost:3000
bun run build # production build check
```
