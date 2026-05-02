# RHYTHM CONTROL — Auditoria Integral Fusionada
## Mobile-First UX + Seguridad + Deep Items

> **Fecha**: 18 abril 2026  
> **Stack**: Next.js 16 App Router / Supabase / Stripe / Tailwind CSS v4  
> **Rama**: fix/lotes-1-3  
> **Total issues**: 53  
> **Fuente**: Fusion de (1) Mobile-First UX Audit HTML, (2) Security Scan, (3) Deep Security Items, (4) Deep Mobile Items

---

## Resumen Ejecutivo

| Criticos | Altos | Medios | Bajos | TOTAL |
|----------|-------|--------|-------|-------|
| 10       | 16    | 17     | 10    | **53** |

**Desglose por dominio**:

| Dominio | C | A | M | B | Total |
|---------|---|---|---|---|-------|
| Mobile-First Architecture | 2 | 2 | 1 | 1 | 6 |
| Layout y CSS Responsiveness | 2 | 2 | 2 | 1 | 7 |
| Next.js App Router Patterns | 1 | 2 | 1 | 1 | 5 |
| UX Movil (Touch/Hover/Inputs) | 1 | 5 | 3 | 2 | 11 |
| Performance Movil | 0 | 2 | 2 | 1 | 5 |
| Auth y Flows Movil | 0 | 1 | 1 | 1 | 3 |
| Checkout Mobile | 0 | 1 | 2 | 0 | 3 |
| CSS/Tailwind Anti-Patterns | 1 | 3 | 1 | 0 | 5 |
| Seguridad (Auth/Session/CSRF) | 3 | 3 | 2 | 1 | 9 |
| RLS / IDOR / Data Access | 2 | 1 | 0 | 0 | 3 |
| **TOTAL** | **10** | **16** | **17** | **10** | **53** |

---

## ETAPA 0 — Estabilizacion Critica
> *Corregir bugs que hacen el proyecto inutilizable. Sin esto, nada mas importa.*

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E0-1 | CRITICO | **PKCE recovery roto**: AuthHashRedirect parsea hash manualmente. En ciertos browsers, el redirect elimina el hash y la pagina queda en "Verificando enlace..." infinitamente. Solucion: usar `exchangeCodeForSession(code)` con parametro `?code=` + Suspense boundary. | AuthHashRedirect.tsx, admin/reset-password/page.tsx | PENDIENTE |
| E0-2 | CRITICO | **Sin error boundaries**: Cualquier error no capturado crashea la app sin recovery. Faltan: app/error.tsx, app/global-error.tsx, app/not-found.tsx, app/admin/error.tsx, app/loading.tsx. | app/ (multiples) | PENDIENTE |
| E0-3 | CRITICO | **Sistema dual de ordenes**: /admin/orders y /admin/order/[id] coexisten con /admin/pedidos y /admin/pedidos/[id]. Confusion y datos inconsistentes. | app/admin/orders/, app/admin/order/ | PENDIENTE |
| E0-4 | ALTO | **overflow-x: hidden como parche**: Oculta el overflow pero no lo resuelve. Causa CLS y scroll elastico roto en iOS Safari. Eliminar y arreglar las causas raiz (logo BARCELONA, Marquee, imagenes sin max-width). | globals.css, Navigation.tsx | PENDIENTE |
| E0-5 | ALTO | **Sin Suspense boundaries**: Paginas con datos Supabase no tienen Suspense. El usuario ve pantalla en blanco hasta que los datos llegan. | page.tsx, novedades/page.tsx, stock/page.tsx | PENDIENTE |
| E0-6 | ALTO | **searchParams Promise sin Suspense**: admin/recover usa `searchParams` como Promise (Next.js 16) sin Suspense boundary. Causa crash. | app/admin/recover/page.tsx | PENDIENTE |

---

## ETAPA 1 — Seguridad
> *Cerrar brechas de seguridad. Despues de esta etapa, el sitio puede desplegarse en produccion con confianza.*

### 1.1 Auth / Session

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E1-1 | CRITICO | **Rate limiting en memoria (Map)**: En Vercel serverless, cada cold start resetea el mapa. Proteccion brute-force ilusoria. Migrar a Upstash Redis o Vercel KV. | lib/rate-limit.ts, proxy.ts | PENDIENTE |
| E1-2 | ALTO | **Sin proteccion CSRF en Server Actions**: login/actions.ts, admin/login/actions.ts, recover/actions.ts, registro/actions.ts no verifican Origin header. Sesion admin vulnerable a CSRF cross-site. | app/*/actions.ts (4 archivos) | PENDIENTE |
| E1-3 | ALTO | **Cookies sameSite: lax para admin**: Deberia ser `strict` para el panel de administracion. | lib/supabase/middleware.ts | PENDIENTE |
| E1-4 | ALTO | **Open redirect en login**: `loginCustomer` acepta parametro `redirect` sin validacion contra whitelist. | app/login/actions.ts | PENDIENTE |
| E1-5 | MEDIO | **ADMIN_SECRET token estatico**: Bearer token fijo en todas las rutas /api/admin/*. Rotacion imposible sin redeploy. | proxy.ts, app/api/admin/*/route.ts | PENDIENTE |
| E1-6 | MEDIO | **CSP con unsafe-inline y unsafe-eval**: Permite inyeccion de scripts. Migrar a nonce-based para scripts propios. | next.config.ts | PENDIENTE |
| E1-7 | BAJO | **Sin X-Request-ID**: No hay trazabilidad entre requests para debugging de incidentes de seguridad. | proxy.ts | PENDIENTE |

### 1.2 RLS / Data Access

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E1-8 | CRITICO | **RLS gaps en releases**: Policy "releases_public_read" solo filtra status=active, pero /api/catalogue usa select(*) incluyendo campos innecesarios (discogs_tracklist, comments, youtube_track_ids). Si se anaden nuevas rutas con createClient() sin RLS estricta, datos sensibles se filtran. | app/api/catalogue/route.ts | PENDIENTE |
| E1-9 | CRITICO | **RLS profiles: validacion por inclusion, no exclusion**: /api/cuenta/profile PATCH filtra por section ("personal"/"shipping"), pero no excluye explicitamente campos como "role". Si se anade un nuevo section, podrian exponerse campos no deseados. | app/api/cuenta/profile/route.ts | PENDIENTE |
| E1-10 | ALTO | **Pedidos anonimos (user_id=NULL) inaccesibles**: Orders creadas antes del registro no son visibles por RLS. Falta mecanismo de "claim" para vincular pedidos anonimos al usuario registrado (por email). | app/cuenta/pedidos/ | PENDIENTE |
| E1-11 | MEDIO | **service_role innecesario en /api/reservations**: Endpoint publico usa createAdminClient() para verificar releases cuando createClient() bastaria para lectura. Superficie de ataque innecesaria. | app/api/reservations/route.ts | PENDIENTE |

### 1.3 Checkout / Payment

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E1-12 | ALTO | **Reservas abandonadas bloquean stock 24h**: reserve_releases RPC marca como reserved, pero el webhook checkout.session.expired llega ~24h despues. Necesario: cron job o expiracion a 30 min. | lib/stripe-utils.ts | PENDIENTE |
| E1-13 | ALTO | **requireAdmin siempre crea adminClient**: requireAdmin() devuelve createAdminClient() incluso cuando no es necesario. Separar: solo crear admin client para webhooks y reservas. | lib/supabase/require-admin.ts | PENDIENTE |
| E1-14 | MEDIO | **Price tampering parcial**: Si db?.price es null (release eliminado de DB), checkout/sessions usa el precio enviado por el cliente como fallback. Rechazar items sin precio DB. | app/api/checkout/sessions/route.ts | PENDIENTE |
| E1-15 | MEDIO | **Tabla stripe_events sin migracion verificada**: Webhook verifica idempotencia contra esta tabla. Si no existe, todos los pagos quedan en pending. | supabase/migrations/ | PENDIENTE |
| E1-16 | MEDIO | **Sin early return en webhook antes de request.text()**: Si STRIPE_WEBHOOK_SECRET falta, el webhook falla al intentar verificar la firma. | app/api/webhooks/stripe/route.ts | PENDIENTE |

### 1.4 Deep Security Items (verificacion pendiente)

| ID | Sev | Issue | Detalle | Estado |
|----|-----|-------|---------|--------|
| E1-17 | ALTO | **IDOR testing**: Verificar si /api/admin/orders/[id] permite acceso a ordenes de otros admins sin verificar ownership. | Requiere test manual o script automatizado | PENDIENTE |
| E1-18 | ALTO | **Env vars en client bundle**: Verificar que NEXT_PUBLIC_* solo exponga lo necesario. Variables como SUPABASE_SERVICE_ROLE_KEY nunca deben estar en el cliente. | next.config.ts, .env* | PENDIENTE |
| E1-19 | MEDIO | **Zod coverage incompleto**: Zod esta instalado pero solo se usa en algunos endpoints. Server Actions y API routes publicas carecen de validacion de schema. | app/api/*, app/*/actions.ts | PENDIENTE |
| E1-20 | MEDIO | **Webhook replay attack**: Verificar que stripe_events.idempotency_key previene replays. Si el insert falla silenciosamente, el mismo evento podria procesarse dos veces. | app/api/webhooks/stripe/route.ts | PENDIENTE |
| E1-21 | MEDIO | **Supabase RLS vs service_role audit completo**: Listar TODOS los endpoints que usan createAdminClient() y verificar que cada uso es estrictamente necesario. | lib/supabase/*.ts, app/api/* | PENDIENTE |

---

## ETAPA 2 — Bugs Funcionales
> *Corregir bugs que afectan la funcionalidad del sitio pero no son bloqueantes para produccion.*

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E2-1 | ALTO | **ReserveModal 409 no manejado**: Si el disco ya esta reservado, el usuario no ve error claro. Mostrar mensaje explicito. | components/store/ReserveModal.tsx | PENDIENTE |
| E2-2 | ALTO | **Newsletter footer muerta**: Input de email no conecta con ningun endpoint. Crear /api/newsletter route o integrar con Resend. | components/layout/Footer.tsx | PENDIENTE |
| E2-3 | ALTO | **Sin paginacion en NovedadesGrid**: Carga TODOS los discos de los ultimos 30 dias. Anadir paginacion. | components/novedades/NovedadesGrid.tsx | PENDIENTE |
| E2-4 | ALTO | **ContactForm mock**: Envia datos con setTimeout simulado en vez de llamada real a API/Resend. | components/contact/ContactForm.tsx | PENDIENTE |
| E2-5 | MEDIO | **Filtros solo de la primera pagina**: CatalogueView extrae styles/labels de los 24 items iniciales, no del catalogo completo. | components/store/CatalogueView.tsx | PENDIENTE |
| E2-6 | MEDIO | **Mock tracklist**: RecordModal muestra MOCK_TRACKLIST con datos de "Strings of Life" cuando no hay datos reales. | components/store/RecordModal.tsx | PENDIENTE |
| E2-7 | MEDIO | **Checkout success/cancel sin navegacion**: El usuario queda atrapado tras pagar. Sin Navigation, sin links de vuelta. | app/checkout/success/page.tsx, app/checkout/cancel/page.tsx | PENDIENTE |
| E2-8 | MEDIO | **FloatingPlayer sin cache**: Cada apertura del mismo disco hace un nuevo fetch a Spotify. Cachear en cliente. | components/store/FloatingPlayer.tsx | PENDIENTE |
| E2-9 | BAJO | **Admin /events redirect**: Usar permanentRedirect en vez de redirect temporal a /admin/agenda. | app/admin/events/page.tsx | PENDIENTE |
| E2-10 | BAJO | **Hero mock data**: Eventos y mix usan MOCK_EVENTS y MIX con URLs de Unsplash. Conectar con Supabase real. | components/home/Hero.tsx | PENDIENTE |

---

## ETAPA 3 — Mobile/UX Responsive
> *Transformar desktop-first a mobile-first. La etapa mas grande y con mayor impacto visual.*

### 3.1 CSS/Tailwind Migration

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E3-1 | CRITICO | **Inline styles masivos**: Navigation, Hero, RecordCard, RecordModal, CartDrawer, FloatingPlayer, Footer, ContactForm, CuentaComponents, AdminShell usan style={{}} para colores, bordes, padding, tipografia. Impide Tailwind responsive, purga CSS, y media queries. Refactorizar a clases Tailwind + CSS variables. | 10+ archivos | PENDIENTE |
| E3-2 | ALTO | **onMouseEnter/onMouseLeave como unico feedback**: Navigation, AdminShell, CuentaComponents, admin/page.tsx usan JS hover con e.currentTarget.style mutation. Impide: responsive hover, transiciones CSS, prefers-reduced-motion, touch feedback. Migrar a CSS :active/:focus-visible + Tailwind hover/active. | Navigation.tsx, AdminShell.tsx, CuentaComponents.tsx, admin/page.tsx | PENDIENTE |
| E3-3 | ALTO | **Colores hardcodeados vs CSS variables**: #000000, #FFFFFF, #F0E040, #FF00FF, #77DD77, #1C1C1C, #999999 etc. en inline styles. variables.css define tokens (--rc-*) pero NO se usan en componentes. | 30+ archivos | PENDIENTE |
| E3-4 | ALTO | **pointer-events hack en RecordCard**: Usa pointerEvents:'none' en overlay con pointerEvents:'auto' en botones internos. Rompe accesibilidad (WCAG): lectores de pantalla no pueden acceder a botones ocultos. | components/store/RecordCard.tsx | PENDIENTE |

### 3.2 Grid y Layout

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E3-5 | CRITICO | **RecordGrid desktop-first**: grid-cols-2 md:grid-cols-6. En movil, 2 cols con aspect-ratio 1/1 hacen tarjetas ~160px en iPhone SE. Ilegibles. Redisenar: layout horizontal (img izq + texto der) en movil. | components/store/RecordGrid.tsx, RecordCard.tsx | PENDIENTE |
| E3-6 | ALTO | **Breakpoint sm: (640px) faltante**: Solo base/768/1024. iPhone SE (375px) = mismo layout que iPhone 15 Pro Max (430px). Anadir sm:640px a variables.css. | styles/variables.css | PENDIENTE |
| E3-7 | ALTO | **RecordModal imagenes side-by-side en movil**: flex-row deja cada imagen a ~187px en iPhone SE. Stack vertical (flex-col) en sm:. | components/store/RecordModal.tsx | PENDIENTE |
| E3-8 | ALTO | **Navigation movil ilegible**: Grid 3x2 con fontSize:0.65rem y padding:14px 4px. "CARRITO (0)" ilegible. Aumentar a 0.75rem minimo. | components/layout/Navigation.tsx | PENDIENTE |
| E3-9 | ALTO | **Footer grid-cols-2 en movil**: Cramped. Stack vertical (grid-cols-1) en movil. Newsletter full-width. | components/layout/Footer.tsx | PENDIENTE |

### 3.3 Touch Targets

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E3-10 | CRITICO | **RecordCard add-to-cart 36x36px**: Debajo de 44px minimo (Apple HIG/Material). Tasa de error alta: usuario toca boton y abre modal accidentalmente. | components/store/RecordCard.tsx | PENDIENTE |
| E3-11 | ALTO | **CartDrawer qty buttons 24x24px**: w-6 h-6, muy por debajo de 44px. Usuario toca "+" cuando queria "-". Visual puede ser 24px con padding touch de 44px. | components/cart/CartDrawer.tsx | PENDIENTE |
| E3-12 | ALTO | **CatalogueTabs arrow touch area pequena**: La flecha del dropdown no es area de toque independiente. | components/store/CatalogueTabs.tsx | PENDIENTE |
| E3-13 | MEDIO | **LanguageSwitcher sin padding**: Botones CAT/ES/EN son texto puro con text-xs. Sin area de toque definida. | components/layout/LanguageSwitcher.tsx | PENDIENTE |

### 3.4 Hover-Only Interactions

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E3-14 | CRITICO | **RecordCard hover-only**: md:group-hover es la unica forma de ver precio y boton "ESCUCHAR". En touch no existe hover. Acciones ocultas en movil. | components/store/RecordCard.tsx | PENDIENTE |
| E3-15 | ALTO | **Logo "BARCELONA" hover-only**: group-hover:opacity-100. En movil nunca se ve. Feature perdida. | components/layout/Navigation.tsx | PENDIENTE |
| E3-16 | ALTO | **Admin dashboard buttons hover-only**: InventoryButton, QuickLink usan onMouseEnter/onMouseLeave. En iPad, no hay feedback visual al tocar. | app/admin/page.tsx | PENDIENTE |
| E3-17 | MEDIO | **Cuenta StatCard/QuickLink hover-only**: En movil, las tarjetas se ven como texto estatico, no como botones clicables. | components/cuenta/CuentaComponents.tsx | PENDIENTE |

### 3.5 Inputs y Teclado Movil

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E3-18 | ALTO | **Login viewport con teclado**: min-h-screen se reduce al abrir teclado virtual iOS/Android. Boton submit puede quedar oculto. Usar dvh y visualViewport. | app/login/page.tsx | PENDIENTE |
| E3-19 | ALTO | **Inputs sin autoComplete/inputMode**: Login password sin autoComplete="current-password". ContactForm sin inputMode="email" ni autoComplete="name". | app/login/page.tsx, ContactForm.tsx | PENDIENTE |
| E3-20 | MEDIO | **Footer newsletter input sin name/autoComplete**: Input decorativo sin funcionalidad. | components/layout/Footer.tsx | PENDIENTE |

### 3.6 Safe Areas y iOS

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E3-21 | ALTO | **CartDrawer sin safe-area-inset-right**: En iPhones con notch/Dynamic Island, el drawer se superpone con la zona segura. | components/cart/CartDrawer.tsx | PENDIENTE |
| E3-22 | MEDIO | **Cuenta nav sin safe-area-inset-top**: fixed top-0 con height:72px. En iOS, se superpone con barra de estado. | app/cuenta/layout.tsx | PENDIENTE |
| E3-23 | MEDIO | **RecordModal iOS scroll lock**: document.body.style.position='fixed' causa salto de posicion al cerrar modal en iOS Safari. | components/store/RecordModal.tsx | PENDIENTE |
| E3-24 | BAJO | **AuthHashRedirect flash**: Redireccion en cliente causa flash de la home antes de saltar a reset-password. | components/auth/AuthHashRedirect.tsx | PENDIENTE |

### 3.7 Accesibilidad Motion

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E3-25 | MEDIO | **Sin prefers-reduced-motion**: StrobeDots (rAF), Marquee (CSS animation), hover transitions no respetan la preferencia de reduccion de movimiento. | StrobeDots.tsx, Marquee.tsx, globals.css | PENDIENTE |
| E3-26 | MEDIO | **AdminShell mobile sin backdrop**: Menu movil sin backdrop y sin bloqueo de scroll del body. Contenido sigue scrolleable. | components/admin/AdminShell.tsx | PENDIENTE |

### 3.8 Checkout Mobile

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E3-27 | ALTO | **CartDrawer sin gestos swipe-to-close**: En iOS, el usuario espera swipe izquierda para cerrar drawers. Fondo opacity-50 sin backdrop-filter blur. | components/cart/CartDrawer.tsx | PENDIENTE |
| E3-28 | MEDIO | **Sin indicador de progreso en checkout**: Flujo multi-paso (carrito > envio > pagar) sin breadcrumbs ni indicador visual. Ansiedad de compra en movil. | components/cart/CartDrawer.tsx | PENDIENTE |
| E3-29 | MEDIO | **Checkout success/cancel planos**: Sin animacion de confirmacion, boton retorno pequeno. | app/checkout/success/page.tsx | PENDIENTE |

---

## ETAPA 4 — Performance
> *Optimizar velocidad de carga y rendimiento, especialmente en dispositivos moviles y conexiones lentas.*

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E4-1 | ALTO | **unoptimized en todas las imagenes**: Desactiva WebP/AVIF y sizes responsivos de Vercel. 24 tarjetas = 3.6-7.2MB de imagenes JPEG. LCP > 4s en movil. Configurar remotePatterns para Discogs y usar sizes prop. | components/store/RecordCard.tsx, RecordModal.tsx + next.config.ts | PENDIENTE |
| E4-2 | ALTO | **CatalogueView monolitico Client Component**: 12 useState hooks, client-side fetch, re-render completo en cada cambio de filtro. Jank visible en movil (200-400ms). Migrar a URL params + RSC. | components/store/CatalogueView.tsx | PENDIENTE |
| E4-3 | ALTO | **FavoriteButton N+1**: Cada boton hace fetch individual a /api/cuenta/favoritos. 24 tarjetas = 24 peticiones HTTP identicas. Batch en una sola llamada + contexto compartido. | components/store/FavoriteButton.tsx | PENDIENTE |
| E4-4 | ALTO | **select(*) en todas las queries**: Incluye campos innecesarios (discogs_tracklist, comments, youtube_track_ids). Aumenta payload HTML. Proyectar solo campos necesarios para la vista. | app/page.tsx, app/api/catalogue/route.ts | PENDIENTE |
| E4-5 | MEDIO | **StrobeDots rAF animation**: requestAnimationFrame fuerza 60 re-renderizados/seg en Client Component. Migrar a CSS @keyframes + will-change:transform. | components/ui/StrobeDots.tsx | PENDIENTE |
| E4-6 | MEDIO | **Marquee CLS + keyframes duplicados**: useEffect + offsetWidth causa layout shift. 24+ tarjetas = 48+ bloques CSS duplicados en DOM. Refactorizar a CSS custom properties + unica @keyframes. | components/ui/Marquee.tsx | PENDIENTE |
| E4-7 | MEDIO | **createAdminClient() por cada webhook event**: Crea nueva instancia Supabase service_role en cada evento. Reutilizar o lazy-initialize. | app/api/webhooks/stripe/route.ts | PENDIENTE |
| E4-8 | MEDIO | **Hero carga todos los tabs**: TOP + MIX + EVENTOS se cargan de una vez. Los tabs inactivos son datos desperdiciados. Separar en RSC con streaming. | components/home/Hero.tsx | PENDIENTE |
| E4-9 | BAJO | **YouTube iframes precargados**: Los iframes de YouTube se cargan aunque el usuario no los reproduzca. Usar lazy loading o placeholder clickeable. | components/player/TrackPlayers.tsx | PENDIENTE |
| E4-10 | BAJO | **Font loading sin optimization**: Sin font-display:swap explicito ni preload de fuentes criticas. | app/layout.tsx, next.config.ts | PENDIENTE |

---

## ETAPA 5 — Arquitectura y Cleanup
> *Mejoras estructurales, type safety, y limpieza de deuda tecnica.*

| ID | Sev | Issue | Archivo(s) | Estado |
|----|-----|-------|------------|--------|
| E5-1 | ALTO | **Sin error boundaries granulares**: Solo falta global. Anadir boundaries por seccion: store, admin, cuenta. | app/store/error.tsx, app/admin/error.tsx | PENDIENTE |
| E5-2 | ALTO | **Client Providers envuelven todo**: Layout raiz envuelve todo en CartProvider + LocaleProvider. Solo necesarios en rutas que los usan. | app/layout.tsx | PENDIENTE |
| E5-3 | MEDIO | **Tipos `any` extendidos**: Multiples componentes usan tipos any. Falta shared types centralizado. | types/index.ts, 10+ componentes | PENDIENTE |
| E5-4 | MEDIO | **i18n sin interpolacion**: Las traducciones son strings literales sin variables. Ej: "Tienes {count} favoritos" imposible. | lib/i18n/ | PENDIENTE |
| E5-5 | MEDIO | **Auth inconsistente**: Algunas rutas usan requireAdmin(), otras verifican manualmente. Estandarizar. | app/admin/*, app/api/admin/* | PENDIENTE |
| E5-6 | MEDIO | **Duplicated logo SVG**: LOGO_PATHS definido en AdminShell y Navigation. Extraer a componente compartido. | AdminShell.tsx, Navigation.tsx | PENDIENTE |
| E5-7 | MEDIO | **CSS variables definidas pero no usadas**: variables.css define --rc-* pero componentes usan colores hardcodeados. (Depende de E3-1/E3-3). | styles/variables.css, 30+ archivos | PENDIENTE |
| E5-8 | MEDIO | **Migraciones sin verificar**: 6 migraciones SQL pero no esta claro cuales estan aplicadas. Verificar estado y crear migracion faltante para stripe_events. | supabase/migrations/ | PENDIENTE |
| E5-9 | BAJO | **border-radius:0 global**: Reset forzado impide border-radius en inputs/botones. En movil, esquinas redondeadas mejoran UX tactil. Considerar excepciones. | globals.css | PENDIENTE |
| E5-10 | BAJO | **CONTEXT.md desactualizado**: No refleja el estado actual del proyecto ni las decisiones de la auditoria. | CONTEXT.md | PENDIENTE |
| E5-11 | BAJO | **Sin tests**: Cero tests unitarios o de integracion. Anadir minimamente tests para: auth flow, checkout flow, RLS policies. | __tests__/ (inexistente) | PENDIENTE |

---

## Deep Mobile Items (verificacion pendiente)

| ID | Categoria | Item | Metodo de verificacion |
|----|-----------|------|----------------------|
| DM-1 | CWV | **Medir LCP/CLS/INP reales**: No hay baseline de Core Web Vitals. Lighthouse CLI + CrUX data. | `npx lighthouse http://localhost:3000 --output=json --emulated-form-factor=mobile` |
| DM-2 | Safe Areas | **Test env(safe-area-inset-*) en iPhone 14+**: Verificar notch/Dynamic Island en Simulador Xcode. | Xcode Simulator + Safari DevTools |
| DM-3 | iOS Scroll | **Test body scroll lock en iOS 16/17**: Verificar posicion de scroll al cerrar RecordModal en Safari. | Manual en dispositivo real |
| DM-4 | Network | **Medir payload total en 3G**: Throttle a 1.6Mbps/3G y medir tiempo de carga completo. | Chrome DevTools Network throttle |
| DM-5 | Real Device | **Test en iPhone SE, Pixel 7, iPad Air**: Verificar layout en 3 dispositivos reales. | Manual o BrowserStack |
| DM-6 | Touch | **Test touch targets con Accessibility Inspector**: Verificar que todos los botones cumplen 44px. | Xcode Accessibility Inspector |

---

## Anti-Patterns Detectados

| # | Patron | Ejemplo | Afectacion |
|---|--------|---------|-----------|
| 1 | Desktop-first design | md:grid-cols-6 como base | Movil es afterthought |
| 2 | Inline styles extensivos | style={{color:'#F0E040'}} | Impide responsive + purga CSS |
| 3 | Hover-only interactions | md:group-hover, onMouseEnter | No funciona en touch |
| 4 | N+1 API calls | FavoriteButton fetch individual | 24 requests identicas |
| 5 | Monolithic Client Component | CatalogueView 12 useState | Jank en movil |
| 6 | CSS variables no conectadas | variables.css ignorado | Colores hardcodeados en 30+ archivos |
| 7 | Rate limiting en memoria | Map en serverless | Ilusorio en Vercel |
| 8 | select(*) sin proyeccion | Todas las queries Supabase | Payload innecesario |
| 9 | Mock data sin reemplazar | Hero MOCK_EVENTS | Funcionalidad muerta |

---

## Convenciones

- **Estado**: PENDIENTE → EN PROGRESO → HECHO → VERIFICADO
- **Severidad**: CRITICO > ALTO > MEDIO > BAJO
- **Cada sesion**: Leer PROGRESO_ETAPAS.md para saber donde estamos, actualizar al finalizar
- **Cada issue**: Marcar en PROGRESO_ETAPAS.md con fecha y commit hash cuando se completa
