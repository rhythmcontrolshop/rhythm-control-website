# Design System — Rhythm Control

## Chosen Direction
- Selected mockup: Variación B (Split View / Panel lateral)
- Design rationale: Lista izquierda + detalle/form derecha. Slide-over para clientes. Pasos visuales en /registro/pendiente.
- **CRÍTICO**: No crear CSS nuevo. Usar exclusivamente las clases y variables CSS ya existentes en el proyecto.

## Source of Truth
- `styles/variables.css` — tokens de diseño (colores, tipografía, espaciado, bordes)
- `app/globals.css` — estilos globales y reset
- Tailwind CSS 4.2.2 con utility classes existentes

## Visual Principles
- Background: `#000000` (`--rc-color-bg`)
- Text: `#FFFFFF` (`--rc-color-text`)
- Accent: `#F0E040` (`--rc-color-accent`)
- Separator/border: `#1C1C1C` (`--rc-color-separator`)
- Muted: `#999999` (`--rc-color-muted`)
- Overlay: `rgba(0,0,0,0.85)` (`--rc-color-overlay`)

## Typography
- Display: `"Helvetica Neue"` — `font-display` class, `--rc-font-display`, letter-spacing `--rc-tracking-display` (-0.04em)
- Mono: `"Space Mono"` — `font-mono` class, `--rc-font-mono`, letter-spacing `--rc-tracking-mono` (0.07em)
- Tamaños via `--rc-text-*` variables o clases Tailwind equivalentes

## Borders & Radius
- `border-radius: 0` siempre (`--rc-radius: 0`) — sin bordes redondeados
- Bordes: `--rc-border-card` (1px solid #1C1C1C), `--rc-border-main` (2px solid #FFFFFF), `--rc-border-accent` (2px solid #F0E040)

## Component Patterns
- **Buttons primarios**: `bg-[#F0E040] text-black font-bold tracking-widest` — sin border-radius
- **Buttons secundarios**: `border border-[#1C1C1C] text-[#999]` — sin border-radius, sin background
- **Inputs**: `bg-black border border-[#1C1C1C] text-white font-mono` — focus: `border-[#F0E040]`
- **Selects**: mismo patrón que inputs
- **Errores inline**: texto rojo `text-red-500` debajo del form, sin toast
- **Success inline**: texto verde `text-green-500`, sin toast

## Layout — Admin
- Layout base en `app/admin/layout.tsx` — usar AdminShell existente
- Padding estándar: `p-6 md:p-10`
- Max-width: `max-w-4xl mx-auto` (mismo que /admin/ajustes)
- Split view: flex row, border entre paneles via `border-r border-[#1C1C1C]`
- Slide-over: panel fixed derecho, `border-l border-[#1C1C1C]`, `bg-black`

## Pattern for New Admin Forms
```tsx
// Header de página admin (patrón existente de /admin/ajustes, /admin/clientes)
<div className="flex justify-between items-center mb-8"
     style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
  <Link href="/admin" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
  <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>TÍTULO</h1>
  <div />
</div>

// Mensajes de error/success (patrón existente de /admin/ajustes)
{error && (
  <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
    <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
  </div>
)}
{msg && (
  <div className="mb-4 p-3" style={{ border: '1px solid #22c55e', backgroundColor: '#f0fdf4' }}>
    <p className="text-xs" style={{ color: '#22c55e' }}>{msg}</p>
  </div>
)}

// Input (patrón existente)
<input
  className="w-full text-xs p-2 font-mono"
  style={{ background: '#000', border: '1px solid #e5e7eb', color: '#000' }}
/>

// Botón primario (patrón existente)
<button
  className="text-xs px-4 py-2 font-bold transition-opacity disabled:opacity-40"
  style={{ background: '#000000', color: '#FFFFFF', border: '1px solid #000000' }}
>
  GUARDAR
</button>
```

## DO NOT
- No añadir nuevas librerías de UI (no shadcn, no radix, no headlessui)
- No crear nuevas clases CSS globales
- No usar border-radius > 0
- No usar toasts — solo errores inline
- No usar colores fuera de las variables `--rc-color-*`
- No cambiar el layout de AdminShell
