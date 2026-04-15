// lib/rate-limit.ts
// Rate limiting en memoria (para producción usar Redis/Upstash)
// Límite: 5 reservas por IP cada hora

const requests = new Map<string, { count: number; resetAt: number }>()

const LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hora

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = requests.get(ip)

  if (!record || now > record.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: LIMIT - 1, resetIn: WINDOW_MS }
  }

  if (record.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now }
  }

  record.count++
  return { allowed: true, remaining: LIMIT - record.count, resetIn: record.resetAt - now }
}

// Limpiar entradas expiradas cada 10 minutos
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of requests) {
    if (now > record.resetAt) requests.delete(ip)
  }
}, 10 * 60 * 1000)
