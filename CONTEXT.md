# RHYTHM CONTROL — CONTEXTO
Tienda online de discos en Barcelona. DJ activo con dos sellos propios.
Stack: Next.js 16 + TypeScript + Tailwind v4 + Shopify Headless + Supabase + Vercel

---

## REGLAS DE ARQUITECTURA

- El cliente solo toca Discogs. Todo sync es automático vía cron job
- Admin en /app/admin/* protegido por middleware
- Nunca hardcodear colores o fuentes — todo en styles/variables.css
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

---

## DIRECTRICES DEL PROYECTO

### 1. Localización y Formato
- Idioma principal: Español (ES). Todos los textos de interfaz, mensajes de error y etiquetas en español
- Moneda: Euro (€). Formato estándar: 1.234,56 €
- Fechas: formato DD/MM/AAAA, hora en formato 24h

### 2. Arquitectura de Estilos (CSS)
- Fuente única de verdad: styles/variables.css con todos los design tokens como CSS Custom Properties (--rc-*)
- El @theme de Tailwind v4 en globals.css referencia siempre las variables de styles/variables.css
- Nunca hardcodear valores de color, tipografía, espaciado o bordes fuera de styles/variables.css
- Responsive Mobile-First: breakpoints en orden sm → md → lg → xl → 2xl
  - sm:  480px  (móvil landscape)
  - md:  768px  (tablet)
  - lg:  1024px (desktop pequeño)
  - xl:  1280px (desktop)
  - 2xl: 1440px (desktop grande)
- Grid del catálogo: 2 cols (móvil) → 3 cols (tablet) → 6 cols (desktop)

### 3. Principios de Desarrollo
- Modularidad estricta: componentes pequeños con única responsabilidad
- Preservación de código: extender sobre modificar. No alterar partes resueltas salvo refactorización técnica necesaria
- Aislamiento: arquitecturas que eviten efectos en cascada al tocar archivos individuales
- Nomenclatura: PascalCase para componentes, camelCase para funciones/vars, kebab-case para rutas y archivos CSS
- Imports: usar siempre el alias @/* (nunca rutas relativas ../../../)

### 4. Formato de Entrega
- Proporcionar siempre bloques de código completos para evitar errores de pegado parcial
- Indicar siempre la ruta del archivo al inicio de cada bloque

### 5. Gotchas de Setup (aprendidos)
- El `.env.local` debe estar en la raíz del proyecto (al lado de `package.json`). Next.js NO lo carga si está en otro directorio
- Cada cambio en `.env.local` requiere reiniciar el servidor (`Ctrl+C` + `npm run dev`). El hot reload no recarga env vars
- Nunca clonar el repo dentro de sí mismo. Si existe una subcarpeta con el mismo nombre del proyecto, borrarla con `rm -rf nombre-subcarpeta` desde la raíz
- El login admin lee el formulario via `FormData` (no estado React) para compatibilidad con gestores de contraseñas y autofill del navegador
- Los datos de muestra (seed) se insertan desde `/admin` → botón "INSERTAR MUESTRA". Usan `discogs_listing_id >= 9000` para distinguirse de datos reales

---

## ESTRUCTURA DE ESTILOS

```
styles/
  variables.css     ← ÚNICO archivo editable para tokens visuales
app/
  globals.css       ← @import variables.css + @theme Tailwind + utilidades globales
```

---

## FASES

- Fase 0 (COMPLETADA): setup base, globals.css, variables.css, tipos TypeScript, schema Supabase
- Fase 1 (COMPLETADA): Discogs sync + admin escáner barcode + seed datos de muestra
- Fase 2: catálogo público + filtros + player flotante + BPM/key
- Fase 3: hero dividido + sellos + agenda eventos + mix del mes
- Fase 4: reservas + WhatsApp + emails + wantlist
- Fase 5: requests votados + perfil usuario
- Fase 6: Instagram Shopping + Rekordbox XML + TIPSA + Packlink + Printful
- Fase 7: Shazam vinyl + recomendación semántica + newsletter

---

## COMPONENTES PRINCIPALES (home, todo en una página sin recargas)

- Navigation: logo izquierda, links centro, carrito derecha — border-bottom 2px white
- HeroSection: dos columnas divididas por línea blanca 2px
  - Columna izquierda: tabs "Mix del mes" / "Comunidad" (amarillo activo)
  - Columna derecha: próximo evento con flyer dominante
- CatalogueTabs: tabs género con amarillo activo, border-top y bottom 2px white
- RecordGrid: 2/3/6 columnas (móvil/tablet/desktop), cards con título strip + imagen a sangre
  - Hover: imagen desaparece, muestra artista + metadata + BPM + key + precio + botones
- FloatingPlayer: fixed bottom, border-top 2px white, IBM Plex Mono
- RecordModal: abre sobre la página, no navega

---

## VARIABLES DE ENTORNO NECESARIAS (.env.local)

```
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
```
