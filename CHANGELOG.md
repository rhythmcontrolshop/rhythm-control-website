# Changelog — Rhythm Control Website

## [0.4.0] — 2026-04-16

### Pedidos — Detalle mejorado + API admin orders
- **API `/api/admin/orders`**: listado con búsqueda, filtros (estado, tipo, fecha) y paginación
- **API `/api/admin/orders/[id]/refund`**: reembolso via Stripe con restauración de stock
- **API PATCH `/api/admin/orders/[id]`**: soporte para `tracking_number` y `notes`
- **Pedidos listing** (`/admin/pedidos`): búsqueda, filtros por estado/tipo, paginación, stats (pedidos hoy, revenue, cancelados)
- **Detalle de pedido** (`/admin/pedidos/[id]`): tracking number, timeline, notas internas, reembolso, mejor layout 3 columnas
- **Dashboard**: stats de pedidos + revenue total + enlaces a todas las secciones
- **Layout admin**: Clientes y Discogs en la navegación + menú hamburguesa en móvil
- **Eliminada** vieja página mock `/admin/order/[id]`

## [0.3.0] — 2026-04-15

### Navegación admin + nuevas páginas
- **Guardi** (`/admin/guardi`): branding Click & Collect, combina reservas + orders con pickup_code
- **Códigos** (`/admin/codigos`): 3 tabs — escanear con cámara, buscar manual, generar código
- **Pedidos** (`/admin/pedidos`): listado de pedidos desde `orders` table
- **Clientes** (`/admin/clientes`): búsqueda por nombre/email, tabla con estadísticas
- **Discogs** (`/admin/discogs`): sync inventario + enriquecer datos + historial de jobs
- **Agenda** (`/admin/agenda`): gestión de eventos
- **API `/api/admin/customers`**: listado con búsqueda y stats de pedidos
- Navegación renombrada: Reservas → Guardi, Escanear → Códigos
- Enlaces actualizados en Dashboard

## [0.2.0] — 2026-04-14

### Build fixes + despliegue
- Fix: YouTube search route crash sin env vars → `createAdminClient()` lazy inside handler
- Fix: Static prerender de páginas con Supabase → `export const dynamic = 'force-dynamic'` en 6 páginas
- Fix: Middleware excluye `/admin/recover` y `/admin/reset-password`
- Fix: Eliminar `proxy.ts` conflictivo con middleware Next.js 16
- Deploy exitoso en Vercel (rama `recovery/avances`)

## [0.1.0] — 2026-04-13

### E-commerce completo
- Checkout con Stripe (sessions, webhooks, reembolsos)
- Catálogo de vinylos desde Supabase
- Sistema de reservas con expiración automática
- Canales de precio: Physical ×0.95, Online ×1.05, Discogs ×1.10
- Sincronización con Discogs (listings + enriquecer datos)
- Panel admin con inventario, precios, envíos, reservas
- Autenticación con Supabase Auth
- Soporte multi-idioma (cat/es/eng)
- Diseño B/N (white-on-black) tema admin
