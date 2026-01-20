import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Stwórz rate limiter tylko jeśli skonfigurowany jest Upstash
function createRateLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Upstash not configured - rate limiting disabled')
    return null
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requestów na minutę
    analytics: true,
  })
}

export const rateLimiter = createRateLimiter()

// Rate limiter dla chatu (droższy - mniej requestów)
function createChatRateLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 wiadomości na godzinę per IP
    analytics: true,
  })
}

export const chatRateLimiter = createChatRateLimiter()

// Helper do pobierania IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}
