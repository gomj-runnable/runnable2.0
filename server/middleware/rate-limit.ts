interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000

const LIMITS = {
  auth: 10,
  weather: 30,
  default: 60,
} as const

function getLimit(path: string): number {
  if (path.startsWith('/api/auth/')) return LIMITS.auth
  if (path.startsWith('/api/weather/')) return LIMITS.weather
  return LIMITS.default
}

function pruneExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart >= WINDOW_MS) {
      store.delete(key)
    }
  }
}

export default defineEventHandler((event) => {
  const path = event.path

  if (!path.startsWith('/api/')) {
    return
  }

  const ip =
    getRequestIP(event, { xForwardedFor: true }) ??
    getHeader(event, 'x-forwarded-for') ??
    'unknown'

  const limit = getLimit(path)
  const key = `${ip}:${limit}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now })

    if (store.size % 100 === 0) {
      pruneExpiredEntries()
    }

    return
  }

  entry.count += 1

  if (entry.count > limit) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000)

    setHeader(event, 'Retry-After', String(retryAfter))
    setHeader(event, 'X-RateLimit-Limit', String(limit))
    setHeader(event, 'X-RateLimit-Remaining', '0')

    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    })
  }

  setHeader(event, 'X-RateLimit-Limit', String(limit))
  setHeader(event, 'X-RateLimit-Remaining', String(limit - entry.count))
})
