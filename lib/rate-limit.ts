// lib/rate-limit.ts
// Rate limiting con soporte para Upstash Redis en producción.
// Si UPSTASH_REDIS_REST_URL no está configurado, usa Map en memoria (solo desarrollo).

const LIMIT_AUTH = 10        // intentos por ventana para auth
const LIMIT_RESERVATION = 5  // reservas por IP por hora
const WINDOW_AUTH_MS = 60 * 1000       // 1 minuto
const WINDOW_RESERVATION_MS = 60 * 60 * 1000 // 1 hora

// ── In-memory fallback (solo desarrollo) ──────────────────────
const memoryStore = new Map<string, { count: number; resetAt: number }>()

async function checkWithRedis(
  key: string, limit: number, windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    // Fallback a memoria si no hay Redis configurado
    return checkWithMemory(key, limit, windowMs)
  }

  try {
    const now = Date.now()
    const windowStart = now + windowMs

    // Usar Redis INCR + EXPIRE para rate limiting atómico
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, Math.ceil(windowMs / 1000)],
      ]),
    })

    if (!response.ok) {
      // Si Redis falla, permitir el request (fail open)
      console.error('Redis rate limit error, failing open')
      return { allowed: true, remaining: limit, resetIn: windowMs }
    }

    const data = await response.json()
    const count = data?.[0]?.result ?? 1

    if (count === 1) {
      // Primera request en la ventana, setear expiración
      await fetch(`${redisUrl}/expire/${key}/${Math.ceil(windowMs / 1000)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetIn: windowMs,
    }
  } catch {
    // Fail open si Redis no responde
    console.error('Redis unavailable, failing open')
    return { allowed: true, remaining: limit, resetIn: windowMs }
  }
}

function checkWithMemory(
  key: string, limit: number, windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = memoryStore.get(key)

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count, resetIn: record.resetAt - now }
}

// ── Public API ────────────────────────────────────────────────

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  return checkWithMemory(`reserve:${ip}`, LIMIT_RESERVATION, WINDOW_RESERVATION_MS)
}

export async function checkAuthRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  return checkWithRedis(`auth:${ip}`, LIMIT_AUTH, WINDOW_AUTH_MS)
}

// Limpiar entradas expiradas cada 10 minutos (solo para memory store)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of memoryStore) {
      if (now > record.resetAt) memoryStore.delete(key)
    }
  }, 10 * 60 * 1000)
}
