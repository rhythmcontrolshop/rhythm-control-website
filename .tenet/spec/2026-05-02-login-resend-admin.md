# Spec: Login / Resend / Admin Content Editing

Date: 2026-05-02
Feature: login-resend-admin
Interview: .tenet/interview/2026-05-01-login-resend-admin.md
Design: .tenet/visuals/2026-05-01-02-mockup-variacion-B.html (Variación B — Split View)
Prototype: .tenet/visuals/2026-05-01-04-prototype-admin-flows.html

---

## Purpose

Auditoría y reparación de los flujos de autenticación (registro, login, recuperación), configuración de Resend (dominio verificado + URLs correctas), y construcción de capacidades de edición faltantes en el panel admin (shipping rates, clientes). El resultado es un sistema de auth funcional end-to-end y un panel admin con cobertura de edición completa sobre las entidades clave.

---

## Tech Stack

| Tecnología | Versión | Notas |
|-----------|---------|-------|
| Next.js | 16.2.2 | App Router, Server Actions, Route Handlers |
| Supabase JS | ^2.102.1 | Auth v2, SSR con @supabase/ssr ^0.10.0 |
| Resend SDK | ^6.11.0 | Email transaccional |
| Tailwind CSS | 4.2.2 | Sin nuevas clases — usar patrones existentes |
| TypeScript | ^5 | Strict mode |
| Vitest | — | Tests unitarios (existente) |

---

## API Endpoints

### Existentes — a verificar/reparar

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `app/registro/actions.ts` (Server Action) | — | Registro nuevo cliente. Debe: crear cuenta, enviar welcome email, redirigir según estado email_confirmed_at |
| POST | `app/login/actions.ts` (Server Action) | — | Login email+password. Redirige a `/cuenta` o error |
| POST | `app/admin/recover/actions.ts` (Server Action) | — | Enviar email de recuperación de contraseña |
| GET | `/auth/callback` | — | **NUEVO** — Callback de Supabase para email confirmation y magic links |

### Existentes — admin (verificar que funcionan)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/admin/settings` | Admin | Leer site_settings (legal, store, discogs) |
| PATCH | `/api/admin/settings` | Admin | Actualizar site_settings |
| GET | `/api/admin/shipping-rates` | Admin | Listar tarifas de envío |
| POST | `/api/admin/shipping-rates` | Admin | Crear nueva tarifa |
| PATCH | `/api/admin/shipping-rates` | Admin | Actualizar tarifa (precio, nombre, activar/desactivar) |
| DELETE | `/api/admin/shipping-rates` | Admin | Eliminar tarifa |

### Nuevos — clientes editor

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| PATCH | `/api/admin/users` | Admin | **NUEVO** — Actualizar perfil de cliente (full_name, phone, address, city, postal_code) |

---

## Páginas Nuevas

| Ruta | Descripción |
|------|-------------|
| `/registro/pendiente` | Página de confirmación pendiente de email. Muestra email, pasos visuales, botón reenviar |
| `/registro/confirmado` | Página de éxito post-confirmación. Muestra "¡Cuenta verificada!" + CTA a `/cuenta` |
| `/auth/callback` | Route handler — procesa token de Supabase y redirige a `/registro/confirmado` o `/cuenta` |

---

## Database Schema

### Tablas existentes — no modificar

| Tabla | Relevancia |
|-------|-----------|
| `profiles` | Datos de cliente. Campos editables por admin: `full_name`, `phone`, `address`, `city`, `postal_code` |
| `shipping_rates` | Tarifas de envío. CRUD completo via `/api/admin/shipping-rates` |
| `site_settings` | Textos legales, datos tienda. CRUD via `/api/admin/settings` |

### shipping_rates — campos del formulario nuevo

| Campo | Tipo | Requerido | Default |
|-------|------|-----------|---------|
| name | text | Sí | — |
| method | text | Sí | home_delivery |
| price | numeric | Sí | — |
| zone | text | No | es_peninsula |
| carrier | text | No | — |
| free_above | numeric | No | **null** (sin envío gratis por defecto) |
| is_active | boolean | No | true |

---

## Auth Flow Completo

### Registro nuevo cliente
1. Usuario rellena `/registro` (email, password, username opcional)
2. `registerCustomer()` valida: email no vacío, password ≥8 chars, 1 mayúscula, 1 dígito
3. `supabase.auth.signUp()` crea el usuario
4. Si `data.user.email_confirmed_at === null` → redirect `/registro/pendiente`
5. Si `email_confirmed_at` tiene valor (confirmaciones OFF) → enviar welcome email → redirect `/cuenta?welcome=true`
6. En `/registro/pendiente`: botón "Reenviar" llama a `supabase.auth.resend({ type: 'signup', email })`
7. Usuario hace clic en email → Supabase redirige a `/auth/callback?code=...`
8. `/auth/callback` llama a `supabase.auth.exchangeCodeForSession(code)`
9. Redirect a `/registro/confirmado`
10. `/registro/confirmado` muestra "¡Cuenta verificada!" + botón a `/cuenta`

### Login email+password
1. Usuario rellena `/login` (email, password)
2. `loginCustomer()` llama a `supabase.auth.signInWithPassword()`
3. Si error `"Email not confirmed"` → redirect `/login?error=email-no-confirmado`
4. Si error credenciales → redirect `/login?error=credenciales-incorrectas`
5. Si rate limited (>10 intentos/min) → redirect `/login?error=demasiados-intentos`
6. Si OK → `revalidatePath('/', 'layout')` → redirect `/cuenta`

### Recuperar contraseña
1. Usuario va a `/admin/recover` (o `/recuperar`), introduce email
2. `recoverPassword()` llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL + '/auth/callback?type=recovery' })`
3. Usuario recibe email con link (expira 1h)
4. Click en link → `/auth/callback?code=...&type=recovery`
5. `/auth/callback` detecta `type=recovery` → `exchangeCodeForSession(code)` → redirect `/admin/reset-password`
6. Usuario introduce nueva contraseña → `supabase.auth.updateUser({ password })`
7. Redirect a `/recuperar?success=true` → muestra "¡Contraseña cambiada!" + link a `/login`

---

## Resend — Configuración

| Variable | Valor actual | Valor correcto |
|----------|-------------|----------------|
| `RESEND_FROM_EMAIL` | (sin configurar / onboarding@resend.dev) | `noreply@rhythmcontrolbarcelona.com` (tras verificar dominio) |
| `NEXT_PUBLIC_SITE_URL` | `https://rhythmcontrolbarcelona.com` | ✓ ya correcto |
| `ADMIN_EMAIL` | (verificar) | email del owner para notificaciones |

### DNS Records para Resend (a añadir en registrador del dominio)
El agente de ejecución generará los valores exactos. Formato típico:
- TXT `resend._domainkey.rhythmcontrolbarcelona.com` → DKIM value de Resend dashboard
- TXT `rhythmcontrolbarcelona.com` → `v=spf1 include:amazonses.com ~all`
- TXT `_dmarc.rhythmcontrolbarcelona.com` → `v=DMARC1; p=none`

### Welcome email link (bug a corregir)
`lib/resend.ts` línea con fallback URL: cambiar `'https://rhythm-control-website.vercel.app'` por `process.env.NEXT_PUBLIC_SITE_URL || 'https://rhythmcontrolbarcelona.com'`

---

## Admin — Capacidades Nuevas

### 1. Shipping Rates — Split View + Form crear/editar

**Fichero**: `app/admin/shipping/page.tsx` + `ShippingActions.tsx` (refactor)

Layout Split View (Variación B):
- Izquierda (320px): lista de tarifas, botón "+ NUEVA TARIFA"
- Derecha: form de edición al seleccionar tarifa, form de creación al pulsar el botón
- `free_above`: vacío por defecto (null), sin pre-rellenar

Campos del form:
- `name` (requerido), `price` (requerido), `method` (select, requerido)
- `zone` (select), `carrier` (texto), `free_above` (número, vacío por defecto)
- Toggle `is_active`

### 2. Clientes — Slide-Over de edición

**Fichero**: `app/admin/clientes/page.tsx` → convertir a `'use client'` + añadir slide-over

Layout:
- Tabla existente (mantener columnas actuales)
- Columna nueva: botón "EDITAR" al final de cada fila
- Al hacer clic: slide-over lateral con campos editables
- Campos: `full_name`, `phone`, `address`, `city`, `postal_code`
- Email: solo lectura (no editable)

API nueva: `PATCH /api/admin/users` → `{ id, full_name?, phone?, address?, city?, postal_code? }`
Actualiza tabla `profiles` usando `createAdminClient()` (service_role).

### 3. Admin Ajustes — Solo verificar

`/admin/ajustes` ya tiene editor funcional (tabs + save). Solo smoke-test que funciona en staging.

---

## Mensajes de Error — Mapa Completo

| Código | Mensaje visible |
|--------|----------------|
| `credenciales-incorrectas` | "Email o contraseña incorrectos." |
| `email-no-confirmado` | "Por favor confirma tu email antes de iniciar sesión." + botón reenviar |
| `demasiados-intentos` | "Demasiados intentos. Espera 1 minuto." |
| `email-existe` | "Este email ya está registrado." |
| `password-corto` | "La contraseña debe tener al menos 8 caracteres." |
| `password-debil` | "La contraseña debe contener al menos una mayúscula y un número." |
| `campos-requeridos` | "Rellena todos los campos." |
| Admin save error | Inline rojo debajo del form. React state preserva inputs. |

---

## Success Criteria

1. **Registro**: Usuario nuevo puede registrarse, llega email de bienvenida a su bandeja, confirma cuenta, ve página de éxito y puede acceder a `/cuenta`.
2. **Login**: Usuario registrado y confirmado puede iniciar sesión en < 3s. Usuario no confirmado ve mensaje específico con botón reenviar.
3. **Recuperar contraseña**: Email de reset llega en < 5min, link funciona en < 1h, usuario puede establecer nueva contraseña y accede con ella.
4. **Resend FROM**: Emails salen desde `noreply@rhythmcontrolbarcelona.com` (tras verificar dominio). Links en emails apuntan a `rhythmcontrolbarcelona.com`.
5. **Shipping CRUD**: Admin puede crear, editar (precio, nombre, zona, método, carrier, free_above, is_active) y eliminar tarifas. `free_above` vacío por defecto.
6. **Clientes edición**: Admin puede editar `full_name`, `phone`, `address`, `city`, `postal_code` de cualquier cliente. Los cambios persisten tras recargar.
7. **Ajustes verificado**: `/admin/ajustes` guarda cambios en `site_settings` (textos legales, datos tienda). Verificado en staging.

---

## Out of Scope

- Magic link / passwordless login (no implementado en la app)
- OAuth / social login
- Admin user management (crear/eliminar admins)
- Email templates HTML avanzados (mantener los actuales)
- Historial de pedidos editable por admin
- Eliminación de clientes
- 2FA / MFA
- Internacionalización de emails
