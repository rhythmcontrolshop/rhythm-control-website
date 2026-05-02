# Decomposition: login-resend-admin

Date: 2026-05-02
Feature: login-resend-admin
Spec: .tenet/spec/2026-05-02-login-resend-admin.md

---

## DAG

```
E0 (auth-callback) ──────────────────────────────────┐
E1 (login-errors) ────────────────────────────────────┤
E2 (resend-fix) ──────────────────────────────────────┤──▶ E5 (ajustes-verify)
E3 (shipping-split-view) ────────────────────────────┤
E4 (clientes-slide-over) ───────────────────────────┘
```

All E0–E4 are independent and can run in any order. E5 is a report-only smoke verification that runs after all implementation jobs.

---

## Jobs

### E0 — Auth Callback + Registro Pages

**Files:**
- CREATE `app/auth/callback/route.ts`
- CREATE `app/registro/pendiente/page.tsx`
- CREATE `app/registro/confirmado/page.tsx`
- MODIFY `app/registro/actions.ts`

**Scope:**
1. Create PKCE callback handler at `/auth/callback` using `supabase.auth.exchangeCodeForSession(code)`. Detect `type=recovery` param → redirect `/admin/reset-password`. Default → redirect `/registro/confirmado`.
2. Create `/registro/pendiente` page: shows email (from query param), visual steps, "REENVIAR EMAIL" button that calls `supabase.auth.resend({ type: 'signup', email })`. Inline success/error messages. No toast.
3. Create `/registro/confirmado` page: "¡Cuenta verificada!" message + CTA button to `/cuenta`.
4. Update `registerCustomer()` in `app/registro/actions.ts`: after `signUp()`, check `data.user?.email_confirmed_at`. If null → redirect `/registro/pendiente?email={email}`. If not null → send welcome email → redirect `/cuenta?welcome=true`.

**CSS constraint:** Copy exact inline styles from `app/admin/ajustes/page.tsx`. No new classes.

---

### E1 — Login Error States

**Files:**
- MODIFY `app/login/actions.ts`
- MODIFY `app/login/page.tsx` (or equivalent login UI file)

**Scope:**
1. In `loginCustomer()`: if error contains "Email not confirmed" → `redirect('/login?error=email-no-confirmado')`.
2. If error is rate-limit (already present) → `redirect('/login?error=demasiados-intentos')`.
3. In login page: display inline error messages per error code (see harness error map). For `email-no-confirmado`: show message + "REENVIAR EMAIL" link to `/registro/pendiente`.
4. All errors: inline red text, no toast, form state preserved.

---

### E2 — Fix Resend Configuration

**Files:**
- MODIFY `lib/resend.ts`

**Scope:**
1. Change `FROM_EMAIL` fallback: `process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'` — keep fallback as onboarding@resend.dev (works without DNS, replaced by env in prod).
2. Fix welcome email link: change hardcoded `'https://rhythm-control-website.vercel.app'` to `process.env.NEXT_PUBLIC_SITE_URL || 'https://rhythmcontrolbarcelona.com'`.
3. Fix password reset email link (same URL bug if present).
4. Verify: no other hardcoded old URLs in the file.

---

### E3 — Admin Shipping Split View

**Files:**
- MODIFY `app/admin/shipping/page.tsx`
- MODIFY (or SPLIT) `app/admin/shipping/ShippingActions.tsx`

**Scope:**
1. Refactor `page.tsx` to Split View layout: left column (320px) = rates list + "+ NUEVA TARIFA" button; right column = create/edit form panel.
2. Form fields: `name` (required), `price` (required, numeric), `method` (select: home_delivery/pickup), `zone` (select: es_peninsula/canarias/baleares/international), `carrier` (text, optional), `free_above` (number, **empty by default — never 0**), `is_active` (toggle).
3. Create: POST `/api/admin/shipping-rates`. Edit: PATCH `/api/admin/shipping-rates`.
4. Validation: if name/method/price missing → inline error "Nombre, método y precio son obligatorios".
5. On save success: refresh list. On save error: keep form open with inline error.
6. `free_above` input: empty string → send `null` to API (never 0).
7. Maintain existing toggle/delete buttons in list rows (already in ShippingActions.tsx).

**CSS constraint:** Copy patterns from `app/admin/ajustes/page.tsx`. No new classes.

---

### E4 — Admin Clientes Slide-Over + PATCH /api/admin/users

**Files:**
- CREATE `app/api/admin/users/route.ts`
- MODIFY `app/admin/clientes/page.tsx`

**Scope:**
1. Create PATCH `/api/admin/users`: `{ id, full_name?, phone?, address?, city?, postal_code? }`. Guard with `requireAdminWithClient()`. Use `createAdminClient()` (service_role) to update `profiles` table. Only update the 5 allowed fields — never `role`, `email`, `id`. Return 200 with updated record.
2. Convert `app/admin/clientes/page.tsx` to `'use client'`. Add "EDITAR" button at end of each table row.
3. Slide-over panel (right side): fields `full_name`, `phone`, `address`, `city`, `postal_code`. Email: read-only. "GUARDAR" button → PATCH `/api/admin/users`. On error: keep slide-over open, show inline error. On success: close slide-over, update row in local state.

**CSS constraint:** Copy slide-over/panel patterns from the interactive prototype `.tenet/visuals/2026-05-01-04-prototype-admin-flows.html`. No new classes.

---

### E5 — Smoke Verify /admin/ajustes (Report Only)

**Type:** report_only

**Scope:**
1. Read `app/admin/ajustes/page.tsx` and `app/api/admin/settings/route.ts`.
2. Verify: tabs (discogs/store/legal/stripe), PATCH endpoint guard, inline success/error messages.
3. Report: PASS if all components are correctly wired. FAIL with specific gap if not.
4. Do NOT modify any files.
