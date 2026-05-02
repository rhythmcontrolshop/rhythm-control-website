# Interview: Login / Resend / Admin Content Editing — Auditoría y Reparación

Date: 2026-05-01
Mode: Full
Rounds: 1

## Clarity Score
- Goal: 0.80 (weight 0.4)
- Constraints: 0.85 (weight 0.3)
- Success criteria: 0.78 (weight 0.3)
- **Total: 0.809 / 0.8 required — ✅ APROBADO**

## Round 1

### Questions Asked

1. ¿Cuál es el problema principal que está roto HOY en producción?
   > Los tres a la vez: login, emails Resend y admin content editing están todos rotos o inestables.

2. ¿En qué entorno está roto?
   > Local + Staging/Preview en Vercel. URL oficial activa: rhythmcontrolbarcelona.com

3. ¿Qué contenidos necesita editar el admin exactamente?
   > No solo los obvios. Hay elementos que deberían poder editarse como envíos (shipping), frases legales, clientes, etc. La tarea incluye detectar qué falta en el panel admin y reparar o crear la capacidad de edición.

4. ¿Cómo describe el fallo de login?
   > Varias combinaciones: bucle infinito en verificación, errores 500/crash, y casos donde el email no llega. Depende del flujo (login normal vs. recuperar contraseña).

5. ¿Qué flujos de email usa Resend?
   > Múltiples flujos con errores, no todos ensayados. Se desconoce el estado exacto de cada uno.

6. ¿Hay tests existentes?
   > No hay tests relevantes. Se pueden crear los necesarios.

7. ¿Cuál es el criterio de éxito?
   > AMBOS: login funcional end-to-end + admin con capacidad de edición completa detectada y reparada.

8. ¿Tienes variables de entorno configuradas?
   > Sí, todas las env vars están en Vercel. URL oficial: rhythmcontrolbarcelona.com

### Contexto técnico observado en el codebase

- **Stack**: Next.js 16 App Router / Supabase / Stripe / Resend / Tailwind CSS v4
- **Rama**: `audit/E0-E5`
- **Estado previo**: 93 issues de auditoría marcados como [x] HECHO pero la mayoría con estado "local" (no verificados en deploy/staging).
- **Auth**: Supabase Auth con PKCE + magic link. AuthHashRedirect corregido localmente (E0-1). Admin con cookie sameSite:strict.
- **Resend**: Usado en `/api/newsletter`, `/api/contact`, y flujos de recuperación/registro.
- **Admin**: Panel en `/app/admin/` con múltiples sub-rutas. Faltan capacidades de edición para shipping, textos legales y datos de clientes.
- **Issues relevantes pendientes de verificación**:
  - E0-1: PKCE recovery — corregido localmente, no verificado en staging
  - E2-2: Newsletter → Resend — corregido localmente
  - E2-4: ContactForm → Resend — corregido localmente
  - Sin verificación de flujos de registro/recuperación en staging

### Decisions Made

- **Modo**: Full (3 áreas críticas con alcance amplio y bordes difusos)
- **Fase 1 — Auditoría activa**: Explorar el código actual de cada área antes de construir el spec.
- **Alcance admin**: No solo detectar bugs, sino también identificar y crear las capacidades de edición faltantes (shipping config, textos legales, gestión de clientes).
- **Sin tests previos**: Crear tests mínimos como parte del harness de evaluación.
- **URL de referencia**: rhythmcontrolbarcelona.com para validar en staging/preview.

### Remaining Ambiguities

- ¿Qué campos de "cliente" necesita editar el admin? (email, dirección, historial de pedidos, etc.)
- ¿Los textos legales están en DB o son archivos estáticos? (necesita scan)
- ¿La configuración de envíos (shipping) usa tabla en Supabase o está hardcodeada?
- ¿El fallo de login es reproducible consistentemente o intermitente?
- ¿Hay un usuario admin real de prueba disponible para testing?

## Round 2

### Questions Asked

9. ¿El fallo de login es reproducible siempre o intermitente?
   > No lo sé / no lo he probado. No hay prueba sistemática hecha.

10. ¿Qué flujos de email de Resend son prioritarios?
    > Magic link / OTP login. Nota adicional: "en general reparar la creación de nuevos clientes" — el registro de nuevos usuarios es la prioridad principal de Resend.

11. ¿Tienes credenciales de admin de prueba para staging?
    > Sí, hay email+pass admin disponible para probar en rhythmcontrolbarcelona.com.

### Findings del scan de código (Round 2)

- **Resend FROM_EMAIL bug crítico**: `lib/resend.ts` usa `process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'`. Si la variable no está en Vercel, cae al dominio de prueba de Resend. En producción real esto podría rechazar emails.
- **NEXT_PUBLIC_SITE_URL hardcodeado con URL antigua**: Los emails de bienvenida/factura usan `process.env.NEXT_PUBLIC_SITE_URL || 'https://rhythm-control-website.vercel.app'`. La URL nueva es `rhythmcontrolbarcelona.com`. Los links en emails apuntan al dominio incorrecto.
- **Login**: Solo usa `signInWithPassword` (email+password). No hay magic link OTP en el flujo de login. El "magic link" puede ser parte del flujo de Supabase Auth nativo (no implementado en la app como acción custom).
- **Registro**: Crea cuenta + envía welcome email (non-blocking). No verifica si Supabase requiere confirmación de email.
- **Textos legales**: En tabla `site_settings` en Supabase DB (categoría `legal`). Editor admin puede leerlos/editarlos vía `/api/admin/settings`.
- **Shipping**: Tiene `/app/admin/shipping/page.tsx` + `ShippingActions.tsx` + `/api/admin/shipping-rates/route.ts`. Existe la página pero hay que auditar si funciona.
- **Clientes**: `/app/admin/clientes/page.tsx` existe. `/api/admin/customers/route.ts` existe. Hay que auditar capacidades.
- **Supabase SDK**: `@supabase/supabase-js: ^2.102.1` (última v2).

### Decisions Made (Round 2)

- **Prioridad máxima**: Registro de nuevos clientes funcional (Resend welcome email + auth flow).
- **NEXT_PUBLIC_SITE_URL**: Debe cambiarse a `https://rhythmcontrolbarcelona.com` en Vercel env.
- **RESEND_FROM_EMAIL**: Verificar que apunta a un dominio verificado (no `onboarding@resend.dev`).
- **Admin audit**: Hacer scan de cada ruta admin para detectar capacidades faltantes o rotas.

## Round 3

### Questions Asked

12. ¿Tienes acceso a Vercel env vars ahora?
    > Sí, puedo verlo ahora.

13. ¿Supabase Email Confirmations está activado?
    > Cree que NO está activado. Tiene sentido activarlo para la nueva URL real.

14. Valor de RESEND_FROM_EMAIL en Vercel:
    > No está configurada correctamente. El usuario quería usar `rhythmcontrolshop@gmail.com` pero Resend NO permite Gmail como FROM. Solución elegida: verificar dominio `rhythmcontrolbarcelona.com` en Resend y usar `noreply@rhythmcontrolbarcelona.com`.

15. Valor de NEXT_PUBLIC_SITE_URL en Vercel:
    > `https://rhythmcontrolbarcelona.com` — ya está correcto.

### Decisions Made (Round 3)

- **RESEND_FROM_EMAIL**: Configurar `noreply@rhythmcontrolbarcelona.com` tras verificar dominio en Resend. El agente generará las instrucciones de DNS. Variable debe añadirse a Vercel.
- **Supabase Email Confirmations**: Activar en el panel de Supabase (Authentication → Email → Enable email confirmations). El flujo de registro debe manejar el estado "pendiente de confirmación".
- **NEXT_PUBLIC_SITE_URL**: Ya correcto (`https://rhythmcontrolbarcelona.com`).
- **Admin clientes**: API soporta campos: id, email, username, first_name, last_name, phone, city, country, address, postal_code. La página existe pero solo muestra — falta capacidad de edición.

### Failure Scenarios (definidos para evaluación)

- Login con credenciales incorrectas → redirect a `/login?error=credenciales-incorrectas` + mensaje visible inline
- Registro con email ya registrado → redirect a `/registro?error=email-existe` + mensaje visible inline
- Registro con contraseña débil → mensaje de error inline en UI
- Email de bienvenida falla → no bloquea el registro (non-blocking), se loguea el error en servidor
- Admin save falla → mensaje de error rojo inline debajo del formulario (no toast); React state preserva los inputs del usuario para reintentar
- Admin página sin auth → redirect a `/admin/login`
- Login rate limited (>10 intentos/min) → mensaje "Demasiados intentos. Espera 1 minuto."

### Login Testing Strategy

Dado que la reproducibilidad es desconocida, la estrategia es:
1. **Auditoría sistemática**: ejecutar todos los flujos manualmente (registro, login, recuperar) y documentar resultado.
2. Si falla → fix + regression test.
3. Si pasa → documentar como "verificado en staging" y marcar sin cambios necesarios.
El criterio de éxito es: todos los flujos se completan sin error visible al usuario en staging.

### Resend Scope Preciso

Flujos en scope (prioridad):
1. **Welcome email** (registro nuevo cliente): `sendWelcomeEmail()` en `app/registro/actions.ts`
2. **Password reset email**: `sendPasswordResetEmail()` en `lib/resend.ts`

Flujos fuera de scope (ya implementados, se verifican de paso):
- Newsletter subscription (footer)
- Contact form

### Password Rules (extraídas del código)

De `app/registro/actions.ts`:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 dígito
- Mensajes de error: `password-corto` → "La contraseña debe tener al menos 8 caracteres", `password-debil` → "La contraseña debe contener al menos una mayúscula y un número"

### Supabase Email Confirmations — Decisión y Criterio

**Decisión**: Activar. El agente verificará el estado en el dashboard y activará si está desactivado.

**Cambios de código requeridos si se activa:**
1. `app/registro/actions.ts`: Tras `supabase.auth.signUp()`, si `data.user.email_confirmed_at` es null → redirect a `/registro/pendiente` (nueva página) en lugar de `/cuenta`.
2. Nueva página `/registro/pendiente`: Muestra "Revisa tu email para confirmar tu cuenta" + botón "Reenviar email".
3. Callback de confirmación: Supabase redirige a `/auth/callback?type=signup` → validar sesión → redirect a página de éxito intermedia.

**Criterio de aceptación**: Usuario registrado NO puede acceder a `/cuenta` hasta confirmar email. Tras confirmar, ve la página de éxito intermedia y puede navegar a `/cuenta`.

**Si ya está activado (estado real)**: Solo verificar que el flujo funciona correctamente. No requiere cambios.

### Welcome Email — Contenido Exacto (del código en `lib/resend.ts`)

- **FROM visible**: `Rhythm Control <noreply@rhythmcontrolbarcelona.com>` (tras verificar dominio)
- **Subject**: `Rhythm Control — Bienvenido/a`
- **Link embedded**: `{NEXT_PUBLIC_SITE_URL}/cuenta` = `https://rhythmcontrolbarcelona.com/cuenta`
- **Spam handling**: Fuera del alcance de este spec (depende del dominio verificado y reputación). Criterio: Resend devuelve 200 y no retorna error de bounced.

### Password Reset Link — Expiración y Comportamiento

- **Expiración**: 1 hora (declarado en el HTML del email, comportamiento estándar de Supabase Auth)
- **Reutilización**: Un solo uso (Supabase invalida el token tras el primer click). Si se hace click dos veces → página de error de Supabase.
- **Criterio de aceptación**: Link funciona en la primera visita dentro de 1h → formulario de nueva contraseña visible. Link expirado o usado → mensaje de error apropiado.

### DNS / Resend Domain Verification — Criterio de Aceptación por Fase

El dominio puede tardar hasta 48h en verificarse tras añadir los registros DNS. Criterios definidos:

| Fase | FROM email | Criterio de PASS |
|------|-----------|-----------------|
| Code review / CI (local) | `onboarding@resend.dev` | Resend API devuelve `{ id: "..." }` sin error (email llega al owner de la cuenta Resend) |
| Staging sign-off | `noreply@rhythmcontrolbarcelona.com` | Dominio verificado en dashboard Resend + email llega a bandeja de prueba real |
| Producción | `noreply@rhythmcontrolbarcelona.com` | Mismo que staging |

**Resolución del bloqueador DNS**: El agente generará los registros DNS exactos (DKIM, SPF, DMARC) en el spec. El usuario los añade en su registrador. La tarea de código se completa y merge-ready con `onboarding@resend.dev`; la verificación DNS es un step operacional paralelo con deadline de 48h tras el merge.

### Stack — Versiones y Compatibilidad

- **Next.js**: 16.2.2 (exacto). No actualizar durante este feature.
- **Tailwind CSS**: **4.2.2** exacto (verificado en `bun.lock`). Usar solo APIs documentadas en Tailwind v4.2.x. Sin uso de features de v3 deprecadas.
- **Supabase JS**: ^2.102.1 (v2 latest)
- **Resend SDK**: ^6.11.0

### Supabase Email Confirmations — Estrategia sin Ambigüedad

El estado real no puede verificarse sin acceso al dashboard. **El código manejará ambos estados de forma segura**:

```typescript
// En registerCustomer, tras signUp():
if (data.user && !data.user.email_confirmed_at) {
  // Email confirmation required — redirect to pending page
  redirect('/registro/pendiente')
} else {
  // No confirmation required (or already confirmed) — normal flow
  redirect('/cuenta?welcome=true')
}
```

Esto es correcto en ambos casos:
- Si confirmaciones OFF: `email_confirmed_at` tendrá valor → flujo normal a `/cuenta`
- Si confirmaciones ON: `email_confirmed_at = null` → redirect a `/registro/pendiente`

Criterio de aceptación: el código compila y el flujo correcto se activa según el estado real del dashboard.

### Admin Coverage — Estado Real (verificado en código)

| Entidad | Estado real verificado en código | Trabajo necesario | Criterio de PASS |
|---------|--------------------------------|------------------|-----------------|
| Ajustes (store + legal + discogs) | `/admin/ajustes` **YA IMPLEMENTADO**: tiene tabs (discogs/store/legal/stripe), campos editables, botón "Guardar" que hace PATCH `/api/admin/settings`, mensajes de éxito/error inline | Solo verificar en staging | PATCH `/api/admin/settings` → 200, valor persiste al recargar la página |
| Shipping rates | `/admin/shipping` tiene toggle(active) + delete. API soporta POST+PATCH+DELETE completo | Añadir: `ShippingForm` (nueva tarifa) + inline edit por fila | Nueva tarifa en lista tras reload; edición de precio/nombre persiste tras reload |
| Clientes | `/admin/clientes` solo lectura (lista + stats) | Añadir: modal/slide-over con campos editables | `full_name`, `phone`, `address`, `city`, `postal_code` editables; PATCH `/api/admin/users` → 200; valores persisten |

**Data persistence on save failure**: Los inputs se mantienen en React state local. El usuario puede corregir y reintentar sin perder lo escrito. No hay mecanismo de persistencia adicional (localStorage u otro).

### Admin Coverage — Scope Cerrado y Concreto

**Scope fijo: exactamente 4 entidades. No se añaden más durante el audit.**

| Entidad | Ruta admin | Gap identificado | Criterio de PASS |
|---------|-----------|-----------------|-----------------|
| Textos legales + datos tienda | `/admin/ajustes` | Auditar si tiene formulario editable | Textarea editable por cada key de `site_settings`, save persiste tras reload |
| Shipping rates | `/admin/shipping` | UI solo tiene toggle+delete. API soporta POST+PATCH completo | Formulario "Nueva tarifa" (name, price, zone, method) + botón "Editar" en cada fila funcional |
| Clientes | `/admin/clientes` | Solo lectura actual | Modal o página de detalle con campos editables: `full_name`, `phone`, `address`, `city`, `postal_code` |

**Campos de clientes editables** (del schema de `profiles`): `full_name` (texto libre, max 100 chars), `phone` (texto libre, no formato forzado), `address` (texto libre), `city` (texto libre), `postal_code` (texto libre). Todos opcionales. Error si falla el save: mensaje inline "No se pudo guardar. Inténtalo de nuevo."

**Shipping rate validación** (del código del API): `name` requerido (texto libre), `price` requerido (número >= 0), `method` requerido (texto libre). Resto opcional. Error si campos requeridos vacíos: "Nombre, método y precio son obligatorios" (ya definido en API).

### Newsletter y Contact Form — Criterio de Aceptación

| Flujo | Criterio de PASS |
|-------|-----------------|
| Newsletter (footer) | HTTP 200 al submit + texto "Suscrito correctamente" visible en UI |
| Contact form (`/contacto`) | HTTP 200 al submit + texto de éxito visible en UI |

### Error UX — Definición Completa

**Formularios de auth (login, registro, recuperar)**:
- Errores: mensaje inline encima del botón submit. No toasts. No auto-dismiss.
- Mensajes exactos del código: `credenciales-incorrectas` → "Credenciales incorrectas", `email-existe` → "Este email ya está registrado", `password-corto` → "La contraseña debe tener al menos 8 caracteres", `password-debil` → "La contraseña debe contener al menos una mayúscula y un número", `campos-requeridos` → "Rellena todos los campos".

**Escenario nuevo — Usuario con email no confirmado intenta login**:
- Supabase devuelve error `"Email not confirmed"`.
- UI muestra: "Por favor confirma tu email antes de iniciar sesión." + link/botón "Reenviar email de confirmación".
- El botón llama a `supabase.auth.resend({ type: 'signup', email })`.
- Criterio de PASS: usuario ve este mensaje (no un error genérico o pantalla en blanco).

**Admin forms (shipping, clientes)**:
- Errores de validación: texto rojo inline debajo del formulario (no toast). Auto-dismiss: no. Desaparece al reintentar exitosamente.
- Shipping rate form error específico: si campos requeridos vacíos → "Nombre, método y precio son obligatorios" (mensaje ya en API, renderizado debajo del botón guardar).
- Cliente edit error: "No se pudo guardar. Inténtalo de nuevo." inline debajo del botón.

### Rate Limiting — Valores Exactos

Implementado en `lib/rate-limit.ts` (issue E1-1, ya corregido). Valores del código:
- **Auth**: 10 intentos / 60 segundos por IP
- **Reservaciones**: 5 / hora por IP
- Backend: Upstash Redis en producción, Map en memoria en dev

**Este spec no cambia estos valores.** El audit de login verificará que el bloqueo funciona (intentar 11 veces → mensaje de error visible al usuario).

### CI/CD — Constraints

No hay pipeline CI/CD automático. Merge requirements: ninguno automático. Deploy: Vercel auto-deploy desde rama main. Los tests se ejecutan manualmente antes del merge.

### Supabase Email Confirmations — Verificación Obligatoria como Primer Paso

**La verificación del estado real es el PRIMER paso de ejecución, no deferred.** El job de auditoría comenzará ejecutando:
```typescript
const { data } = await supabase.auth.getUser()
// Si el usuario tiene email_confirmed_at = null → confirmaciones ON
// Si email_confirmed_at tiene valor → confirmaciones OFF
```
Esta verificación resuelve la ambigüedad antes de cualquier otro cambio de código. El resto del spec ya cubre ambos casos.

### Supabase RLS — Verificación de Permisos Admin

Las operaciones admin usan `createAdminClient()` (service_role key) que bypassa RLS completamente. Esto aplica a:
- PATCH `/api/admin/settings` → `site_settings` tabla
- POST/PATCH `/api/admin/shipping-rates` → `shipping_rates` tabla
- PATCH `/api/admin/users` → `profiles` tabla (via service_role)

No se requiere cambio de RLS. Los permisos admin están garantizados por el service_role key. El audit verificará que `requireAdminWithClient()` funciona correctamente en los endpoints nuevos.

### Performance — Método de Medición

- **Login < 3s**: Medido desde submit del formulario hasta que la página `/cuenta` está completamente renderizada (visual). Herramienta: Network tab en DevTools en Chrome con cache vacío.
- **Admin page load < 2s**: Medido desde navegación a la URL hasta que los datos están visibles (no loading spinner). Chrome DevTools → Performance tab.
- **Admin save < 3s**: Medido desde click del botón "Guardar" hasta que el mensaje de éxito es visible.
- **Email < 5min**: Medido con reloj desde el trigger hasta que el email aparece en bandeja de Gmail/Outlook. Condición: red WiFi estándar, sin throttling.

### DNS Verification — Contingency

Si la verificación DNS de `rhythmcontrolbarcelona.com` en Resend no completa en 48h:
1. Verificar que los registros DNS fueron añadidos correctamente (revisión con herramientas como `dig` o MXToolbox).
2. Contactar soporte de Resend si persiste más de 72h.
3. **Fallback de producción**: Mantenerse en `onboarding@resend.dev` como FROM temporalmente (emails solo llegan al owner de la cuenta Resend). Este fallback es temporal — no se puede usar para clientes reales.
4. No hay otra alternativa técnica que no requiera verificar el dominio.

### Email Delivery Retry — Flujo Definido

Si el email no llega en 5 minutos:
- **Welcome email (registro)**: Página `/registro/pendiente` tiene botón "Reenviar email de confirmación" que llama a `supabase.auth.resend({ type: 'signup', email })`. Sin límite de UI (Supabase limita internamente).
- **Password reset**: Página de recuperación `/recuperar` tiene botón "Reenviar" que resubmite el formulario. El usuario puede intentar N veces.
- Criterio de aceptación: el botón de reenvío existe y responde (200 o error visible). No se testa la entrega real en CI.

### Browser Support

- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile: Chrome en Android, Safari en iOS 14+
- No se requiere IE11 ni navegadores legacy

### Concurrencia y Carga

Tienda pequeña (audiencia local Barcelona). Un usuario individual, WiFi o 4G:
- Login response: < 3s
- Email delivery: < 5 min
- Admin page load: < 2s
- Admin save: < 3s
Sin requisitos de carga concurrente.

### UX Flows — Happy Path Terminal States (confirmados por usuario)

**Post-registro + confirmación email:**
→ Página de éxito intermedia (`/registro/confirmado` o similar) con mensaje "¡Cuenta verificada!" y botón CTA hacia `/cuenta`.

**Post-reset contraseña:**
→ Página de éxito intermedia con mensaje "¡Contraseña cambiada!" y link hacia `/login` para iniciar sesión con la nueva contraseña.

### Login / Auth Flows — Criterio de Aceptación Determinístico

El estado actual de los flujos en staging es un **input del audit** (no pre-conocido por diseño en proyectos brownfield). El spec define el estado TARGET. El audit mide la distancia. Esto es una posición explícita y deliberada del spec, no una omisión.

Criterios binarios PASS/FAIL para el estado TARGET:

| Flujo | Precondición | Criterio de PASS |
|-------|-------------|-----------------|
| Registro nuevo usuario | Email no registrado | Supabase crea usuario + welcome email via Resend + redirect correcto (según estado confirmaciones) |
| Login email+password (email confirmado) | Cuenta activa, email confirmado | Sesión activa en Supabase + redirect a `/cuenta` en < 3s |
| Login email+password (email NO confirmado) | Cuenta sin confirmar email | Error visible "Por favor confirma tu email" + botón reenviar |
| Login rate limited | >10 intentos en 1 min | Mensaje "Demasiados intentos. Espera 1 minuto." visible |
| Recuperar contraseña | Email registrado | Email recibido en < 5min + enlace funciona en < 1h + nueva contraseña activa + página éxito |
| Confirmación email | `email_confirmed_at = null` | Link → `email_confirmed_at` populated + redirect página éxito con botón a `/cuenta` |

El audit ejecuta cada flujo una vez con datos reales. PASS → verificado. FAIL → fix-job obligatorio antes de siguiente flujo.

### Performance Targets (confirmados como aceptables)

- Login response: < 3 segundos
- Email delivery (Resend): < 5 minutos para bienvenida y recuperación
- Admin page load: < 2 segundos
- Admin save operation: < 3 segundos

### Admin Entities — Coverage Required

| Entidad | Página actual | Capacidad actual | Falta |
|---------|--------------|-----------------|-------|
| Textos legales | via `ajustes` | Lectura (site_settings) | Editor de texto |
| Shipping rates | `/admin/shipping` | Parcial | Auditar |
| Clientes | `/admin/clientes` | Solo lectura | Edición de campos |
| Site settings | `/admin/ajustes` | Parcial | Auditar cobertura |
| Pedidos | `/admin/pedidos` | Completo (verificado) | — |
| Releases | `/admin/inventory` | Completo | — |

## Summary

El proyecto Rhythm Control (tienda online de vinilos en Barcelona) tiene 3 áreas críticas rotas en local+staging:

1. **Login/Auth**: Múltiples fallos en distintos flujos (magic link, recuperación, registro). Correcciones locales no verificadas en staging con la URL real.
2. **Resend (email)**: Flujos de newsletter, contacto, confirmación y recuperación conectados a Resend pero estado desconocido en staging.
3. **Admin content editing**: Panel existe pero falta capacidad de edición para shipping, textos legales, y datos de clientes. Necesita audit + construcción de UI faltante.

**Criterio de éxito**: Login funcional end-to-end (registro + login + recuperación) + emails Resend llegando correctamente con URLs correctas + Admin con cobertura de edición completa sobre las entidades detectadas (shipping rates, textos legales, clientes, site settings).

**Issues críticos ya identificados**:
1. `NEXT_PUBLIC_SITE_URL` apunta a URL antigua en emails — debe ser `https://rhythmcontrolbarcelona.com`
2. `RESEND_FROM_EMAIL` puede estar usando `onboarding@resend.dev` si la env var no está en Vercel
3. Flujo de registro no verifica confirmación de email en Supabase Auth
4. Admin panel: auditar shipping, clientes, ajustes, y detectar gaps de edición
