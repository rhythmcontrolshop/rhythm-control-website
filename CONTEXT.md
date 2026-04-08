# RHYTHM CONTROL — CONTEXTO
Tienda online de discos en Barcelona. DJ activo con dos sellos propios.
Stack: Next.js 16 + TypeScript + Tailwind v4 + Shopify Headless + Supabase + Vercel

REGLAS DE ARQUITECTURA:
- El cliente solo toca Discogs. Todo sync es automático vía cron job
- Admin en /app/admin/* protegido por middleware
- Nunca hardcodear colores o fuentes — todo en globals.css
- Tipografía display: Arial Black, uppercase, letter-spacing -0.04em
- Tipografía metadata: IBM Plex Mono, letter-spacing 0.07em
- Fondo siempre negro #000000, texto siempre blanco #FFFFFF
- Acento único: amarillo limón #F0E040 — solo en tab activo, BPM tag, badge M/NM
- Cero border-radius en cualquier elemento — nunca rounded-*
- Separadores principales: 2px solid #FFFFFF
- Separadores entre cards del grid: 1px solid #1c1c1c
- Audio siempre via embed — nunca almacenar audio
- SKU de Shopify = discogs_listing_id
- Supabase para datos extendidos (BPM, key, wantlist, eventos, requests)
- Shopify para comercio (productos, órdenes, checkout, pagos)

FASES:
- Fase 0 (ACTUAL): setup base, globals.css, tipos TypeScript, schema Supabase
- Fase 1: Discogs sync + admin escáner barcode
- Fase 2: catálogo público + filtros + player flotante + BPM/key
- Fase 3: hero dividido + sellos + agenda eventos + mix del mes
- Fase 4: reservas + WhatsApp + emails + wantlist
- Fase 5: requests votados + perfil usuario
- Fase 6: Instagram Shopping + Rekordbox XML + TIPSA + Packlink + Printful
- Fase 7: Shazam vinyl + recomendación semántica + newsletter

COMPONENTES PRINCIPALES (home, todo en una página sin recargas):
- Navigation: logo izquierda, links centro, carrito derecha — border-bottom 2px white
- HeroSection: dos columnas divididas por línea blanca 2px
  - Columna izquierda: tabs "Mix del mes" / "Comunidad" (amarillo activo)
  - Columna derecha: próximo evento con flyer dominante
- CatalogueTabs: tabs género con amarillo activo, border-top y bottom 2px white
- RecordGrid: 6 columnas desktop, cards con título strip + imagen a sangre
  - Hover: imagen desaparece, muestra artista + metadata + BPM + key + precio + botones
- FloatingPlayer: fixed bottom, border-top 2px white, IBM Plex Mono
- RecordModal: abre sobre la página, no navega

VARIABLES DE ENTORNO NECESARIAS (.env.local):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_ADMIN_ACCESS_TOKEN=
SHOPIFY_WEBHOOK_SECRET=
DISCOGS_CONSUMER_KEY=
DISCOGS_CONSUMER_SECRET=
DISCOGS_ACCESS_TOKEN=
DISCOGS_ACCESS_SECRET=
DISCOGS_USERNAME=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
YOUTUBE_API_KEY=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
TIPSA_API_KEY=
PACKLINK_API_KEY=
ADMIN_SECRET=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_STORE_NAME=Rhythm Control
