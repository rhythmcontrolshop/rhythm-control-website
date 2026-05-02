// lib/csrf.ts
// Verificación de Origin header para proteger Server Actions contra CSRF.

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_URL,
  // En desarrollo, permitir localhost
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ] : []),
].filter(Boolean) as string[]

/**
 * Verifica que el Origin header de un request proviene de un dominio permitido.
 * Esto previene ataques CSRF cross-site en Server Actions.
 *
 * En Server Actions, no hay acceso directo a headers, pero podemos usar
 * la estrategia de verificar el referer/origin desde el formData o confiar
 * en que sameSite cookies ya protegen parcialmente.
 *
 * Para API routes, verificamos directamente el Origin header.
 */
export function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Si no hay origin ni referer, permitir (algunos navegadores no envían origin en form posts)
  if (!origin && !referer) return true

  // Verificar origin si está presente
  if (origin) {
    return ALLOWED_ORIGINS.some(allowed => {
      try {
        return new URL(origin).origin === new URL(allowed).origin
      } catch {
        return false
      }
    })
  }

  // Fallback: verificar referer
  if (referer) {
    return ALLOWED_ORIGINS.some(allowed => {
      try {
        return referer.startsWith(allowed)
      } catch {
        return false
      }
    })
  }

  return true
}

/**
 * Valida que una URL de redirección pertenece a nuestros dominios.
 * Previene open redirect attacks.
 */
const ALLOWED_REDIRECT_PATHS = [
  '/cuenta',
  '/stock',
  '/novedades',
  '/contacto',
  '/',
]

export function validateRedirectUrl(url: string): string {
  // Si es una ruta relativa (empieza con /), verificar contra whitelist
  if (url.startsWith('/')) {
    const path = url.split('?')[0] // Ignorar query params
    // Permitir cualquier ruta interna que empiece con /
    // Solo bloquear URLs absolutas externas
    if (!url.startsWith('//') && !url.includes('://')) {
      return url
    }
  }

  // Si es una URL absoluta, verificar que apunte a nuestros dominios
  try {
    const parsedUrl = new URL(url)
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      try {
        return parsedUrl.origin === new URL(allowed).origin
      } catch {
        return false
      }
    })
    if (isAllowed) return url
  } catch {
    // URL inválida
  }

  // Default: redirigir a cuenta
  return '/cuenta'
}
