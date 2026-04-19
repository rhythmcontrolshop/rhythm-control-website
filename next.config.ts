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
      // E1-6: Next.js App Router requiere unsafe-inline para hydration.
      // Stripe.js requiere unsafe-eval. Vercel Live/Analytics necesitan sus dominios.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live https://va.vercel-scripts.v0.dev",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://i.discogs.com https://*.discogs.com https://img.discogs.com https://images.unsplash.com https://picsum.photos https://*.picsum.photos",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.googleapis.com https://api.discogs.com wss://ws-us3.pusherapp.com https://vercel.live",
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
