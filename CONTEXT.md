# RHYTHM CONTROL — Project Context

> Prompt de arranque para nuevas sesiones.
> Última actualización: 18 abril 2026 — Auditoría integral completada (E0-E5 + DM).
> Rama activa: `fix/lotes-1-3`
> Progreso: 87/93 items completados (E0✅ E1✅ E2✅ E3✅ E4✅ E5✅ DM pendiente)

---

## Qué es Rhythm Control

Tienda de vinilos en Barcelona. Vende discos de segunda mano (house, techno, jazz) vía web propia. El dueño es también DJ y tiene sello propio. La web es la cara digital de la tienda: catálogo navegable, previews de audio, eventos, mixes mensuales.

---

## Stack actual

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 App Router, TypeScript |
| Estilos | Tailwind v4 + CSS variables (`--rc-*`) + inline styles (migración en progreso) |
| Build | Turbopack |
| Base de datos | Supabase (PostgreSQL + RLS) |
| E-commerce | Stripe Checkout (reemplazó Shopify) |
| Hosting | Vercel |
| Inventario | Discogs API (listings propios) |
| Audio | YouTube IFrame API + YouTube Data API v3 + Spotify previews |
| Auth | Supabase Auth (PKCE flow) |
| Pagos | Stripe Checkout Sessions + Webhooks |
| Repo | `rhythmcontrolshop/rhythm-control-website` |

---

## Sistema de diseño

**Paleta:**
- Fondo: `#000000`
- Texto primario: `#FFFFFF`
- Acento / highlight: `#F0E040` (amarillo)
- Bordes sutiles: `#1C1C1C` | Bordes estructurales: `#FFFFFF`

**Tipografía:**
- `font-display` — display caps (títulos, botones, labels)
- `font-meta` — texto pequeño informativo

**Principios:**
- Grid 6 columnas desktop / 2 columnas mobile
- Bordes blancos 2px como elemento estructural
- Sin border-radius en ningún sitio
- Amarillo solo para: tab activo, precio, acento de texto, botón primario, placeholder
- Copy siempre en mayúsculas

---

## Componentes completados

### `components/ui/Marquee.tsx`
Velocidad constante 80px/s para todos los marquees del sitio.
- Mide ancho real del texto con `<span>` oculto antes de animar
- Rellena con N repeticiones para que el loop nunca salte
- Separador `·` entre repeticiones
- Keyframe name sanitizado (solo alfanuméricos) — fix "Sgt. Pepper's" y similares
- Props: `text`, `className?`, `style?`

### `components/ui/FlyerPlaceholder.tsx`
SVG placeholder para eventos/mix sin imagen. Estética industrial.
- 8 franjas amarillas a 45° sobre negro, 50/50 amarillo/negro
- Corrección geométrica: `LWIDTH = PERIOD / (2√2)` (a 45° el stroke ocupa más horizontal)
- `preserveAspectRatio="xMidYMid slice"` — se comporta como `object-cover`
- Labels mínimos: código top-left, fecha bottom-right (en negro sobre la franja)
- Props: `title`, `date?`, `type?`, `code?`

### `components/store/RecordCard.tsx`
Tarjeta de vinilo 1:1.
- **Default:** imagen portada + gradiente con `<Marquee>` artista (blanco) y título (amarillo)
- **Hover:** fondo negro, borde blanco 2px izquierda, marquees, label, año/formato, botones `[ESCUCHAR]` y `[€ + carrito]`

### `components/home/Hero.tsx`
Sección principal con tres tabs. Barra: tabs (activo = amarillo) + `<Marquee>` contextual.

#### Tab TOP
Grid 6 columnas de `RecordCard` con badges (STAFF PICK / NEW! / ON HYPE).

#### Tab MIX — grid 6 columnas

| Col 1 | Col 2–3 | Col 4–6 |
|---|---|---|
| Foto DJ (hover zoom, click → lightbox) | Texto | Player Mixcloud `mini=0` |

- Texto: `<Marquee>` nombre DJ (amarillo) + `<Marquee>` procedencia (blanco) + bio bold
- **Highlights en bio:** `{{palabra}}` en el texto → renderiza en amarillo via `parseBio()`
- Botones: `[MIXCLOUD →]` amarillo, `[WEB →]` / `[IG →]` borde blanco
- Sin foto DJ → `<FlyerPlaceholder code="RC-MIX">`
- Embed de prueba: `maxvibes/the-cat-walk-040426-totally-wired-radio`

**Formato embed Mixcloud:**
```
https://www.mixcloud.com/widget/iframe/?hide_cover=0&mini=0&autoplay=0&feed=%2FUSUARIO%2FMIX-SLUG%2F
```
`mini=0` = player completo | `mini=1` = barra compacta | `light=1` = tema blanco

#### Tab EVENTOS — grid 6 columnas, pares texto+flyer

| Eventos | Cols texto | Cols flyer |
|---|---|---|
| 1 | 3 | 3 |
| 2 | 2 | 1 |
| 3 | 1 | 1 |

- Mobile: siempre 2 cols (texto | flyer), eventos apilan verticalmente
- Texto: borde blanco 2px izquierda, fecha `SÁB 18 ABRIL` (calculado de ISO), tipo, `<Marquee>` título, venue truncado, `<Marquee>` lineup, botones `[VER FLYER]` / `[WEB →]`
- Flyer: `object-cover`, click → `FlyerModal`. Sin flyer → `<FlyerPlaceholder>`
- **Fechas en `MOCK_EVENTS`:** ISO `'2026-04-18'`, formateadas en runtime en español

#### `FlyerModal` (inline en Hero.tsx)
Overlay fullscreen. Reutilizado para flyers de eventos y foto DJ del mix.
Cierra con Escape o click en backdrop.

---

## Pipeline de enriquecimiento

### `lib/discogs/enrich.ts`
- `enrichReleases(ids?)` — enriquece releases con datos extendidos de Discogs
- Rate limit 1200ms entre llamadas a la API
- Extrae: `styles`, `genres`, `discogs_tracklist`, `back_cover_image` (segunda imagen), `artist_profile`

### `app/api/admin/enrich/route.ts`
```
POST /api/admin/enrich
Authorization: Bearer {ADMIN_SECRET}
Body opcional: { "releaseIds": ["id1", "id2"] }
```

### `app/api/youtube/search/route.ts`
- Caché en Supabase (`youtube_track_ids`) antes de llamar a YouTube
- Cuota YouTube: 10k unidades/día, reset medianoche Pacific

---

## Player de audio

- `components/player/UnifiedAudioPlayer.tsx` — enruta a Bandcamp iframe o YouTube IFrame API
- `components/player/TrackPlayers.tsx` — búsqueda lazy: `undefined` no buscado / `null` sin resultado / `string` videoId
- `lib/youtube/search.ts` — YouTube Data API v3, prioriza resultado oficial/audio/vevo

---

## Types — campos extendidos en `Release` (`types/index.ts`)

```typescript
youtube_track_ids?:   Record<string, string> | null
bandcamp_album_id?:   string | null
bandcamp_track_id?:   string | null
discogs_tracklist?:   { position: string; title: string; duration?: string; type?: string | null }[] | null
discogs_notes?:       string | null
artist_profile?:      string | null
back_cover_image?:    string | null
```

---

## Infraestructura — decisiones pendientes

### Migración Vercel → Coolify en Hetzner
**Motivación:** eliminar el "Success Tax" — el coste de Vercel escala agresivamente con tráfico.

**Plan:**
- VPS Hetzner (Alemania) desde ~4€/mes — buena relación precio/rendimiento
- Coolify como plataforma self-hosted (open-source, gestiona containers, SSL, dominios)
- Coolify soporta Next.js out-of-the-box via Nixpacks o Dockerfile
- SSL automático vía Let's Encrypt
- Preview deployments vía webhooks de GitHub

**Lo que hay que revisar:**
- Edge functions / middleware — si algo depende del runtime Edge de Vercel
- Image optimization (`next/image`) — necesita configuración en self-hosted
- Variables de entorno: `.env.local` → secrets en Coolify UI

---

## E-commerce — decisión pendiente: Shopify vs Medusa

### Shopify (integración existente)
- ✅ Ya hay código en el proyecto (cart, checkout, variants, Storefront API)
- ✅ Gestión de pagos/envíos/impuestos resuelta out-of-the-box
- ❌ Shopify Payments no disponible en España → comisión extra por transacción
- ❌ Coste fijo $29–$79/mes + apps adicionales
- ❌ Dependencia de plataforma — pricing puede cambiar

### Medusa.js (evaluación)
- ✅ Open-source, self-hosted (mismo Hetzner/Coolify)
- ✅ Sin comisiones por transacción
- ✅ API-first, integración nativa con Next.js App Router
- ✅ Admin UI incluido para pedidos, stock, envíos
- ✅ Proveedores de pago: Stripe (oficial), PayPal, Redsys (comunidad)
- ❌ Setup inicial más complejo (backend Node.js + PostgreSQL separados)
- ❌ Hay que configurar impuestos ES, métodos de envío, etc.
- ❌ Comunidad más pequeña que Shopify

**Contexto del catálogo:** vinilos de segunda mano, inventario único por ítem (sin variantes de talla/color), stock de 1 unidad por release → caso de uso simple que se adapta bien a Medusa.

**Recomendación:** Medusa elimina todas las dependencias de plataforma y encaja con la estrategia de self-hosting en Hetzner. El stack quedaría 100% bajo control propio.

---

## Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Discogs
DISCOGS_TOKEN=

# YouTube
YOUTUBE_API_KEY=        # AIzaSy... (10k unidades/día, reset medianoche Pacific)

# Shopify (mientras se mantenga)
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_TOKEN=
SHOPIFY_ADMIN_TOKEN=

# Admin
ADMIN_SECRET=           # Bearer token para /api/admin/*

# Medusa (si se migra)
MEDUSA_BACKEND_URL=
MEDUSA_PUBLISHABLE_KEY=
```

---

## Tareas pendientes

### Verificación en producción (Deep Mobile)
- [ ] Medir LCP/CLS/INP con Lighthouse
- [ ] Test safe areas en iPhone 14+ (Simulador Xcode)
- [ ] Test scroll lock en iOS 16/17
- [ ] Medir payload en 3G (Chrome DevTools throttle)
- [ ] Test en iPhone SE, Pixel 7, iPad Air
- [ ] Verificar touch targets con Accessibility Inspector

### Contenido / datos
- [ ] Tabla `mixes` en Supabase (reemplazar MIX hardcoded en Hero)
- [ ] Foto DJ real para sección Mix
- [ ] Sync automático Discogs → Supabase

### Próxima fase
- [ ] Tests unitarios mínimos (auth flow, checkout flow)
- [ ] Migración completa inline styles → CSS variables
- [ ] Estandarizar auth en todas las rutas admin (docs)

---

## Workflow local

```bash
# Primera vez
git clone --branch claude/create-website-project-upZgC \
  https://github.com/rhythmcontrolshop/rhythm-control-website.git rhythm-control-website_v2
cd rhythm-control-website_v2
cp /ruta/a/.env.local .env.local
npm install && npm run dev

# Actualizar
cd ~/rhythm-control-website_v2
git pull origin claude/create-website-project-upZgC
```
