# Supabase auth callback PKCE pattern Next.js

type: knowledge
source_job: 00000000-0000-0000-0000-000000000000
job_name: unknown
confidence: decision-only
created: 2026-05-02T06:02:12.263Z

## Findings

- **summary**: Para email confirmation y password reset en Next.js App Router con Supabase PKCE, se necesita un route handler en /app/auth/callback/route.ts. El handler extrae el code param y llama a supabase.auth.exchangeCodeForSession(code). Redirige según el type param: si type=recovery → /admin/reset-password, si no → /registro/confirmado. El proyecto actual NO tiene este route handler — causa que los links de confirmación den 404.
- **pattern**: GET /auth/callback?code=xxx&type=recovery → exchangeCodeForSession(code) → redirect según type
- **gotcha**: NO usar hash fragment parsing — PKCE usa el param ?code= en la URL, no el hash. AuthHashRedirect solo es para el flujo legacy hash-based que aún puede recibirse.
- **reference**: Supabase SSR docs: https://supabase.com/docs/guides/auth/server-side/nextjs
