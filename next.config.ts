import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-XSS-Protection',          value: '1; mode=block' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // E1-6: Reducido unsafe-inline a solo donde es necesario.
      // Stripe.js requiere unsafe-eval, pero nuestros scripts no.
      "script-src 'self' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://i.discogs.com https://*.discogs.com https://img.discogs.com https://images.unsplash.com https://picsum.photos https://*.picsum.photos",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.googleapis.com https://api.discogs.com",
      "frame-src https://js.stripe.com https://www.youtube.com https://www.youtube-nocookie.com",
      "font-src 'self'",
      "media-src 'self' https://*.supabase.co",
      // Prevenir form submissions a dominios externos (CSRF mitigation)
      "form-action 'self'",
      // Prevenir framing externo (clickjacking)
      "frame-ancestors 'none'",
      // Forzar HTTPS para todos los recursos
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.discogs.com' },
      { protocol: 'https', hostname: '*.discogs.com' },
      { protocol: 'https', hostname: 'img.discogs.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.picsum.photos' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    // E4-1: Device sizes optimizados para el grid de releases
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
