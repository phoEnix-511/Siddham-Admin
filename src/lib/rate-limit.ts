import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitType = 'auth' | 'otp_send' | 'otp_verify' | 'api' | 'payment';

// ---------------------------------------------------------------------------
// Shared Redis instance
// ---------------------------------------------------------------------------

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

const redis = createRedis();

// ---------------------------------------------------------------------------
// Limiter factory
// ---------------------------------------------------------------------------

function createLimiter(requests: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: false,
  });
}

// Lazily created limiter map (avoids constructing all limiters on every cold start)
const limiters: Partial<Record<RateLimitType, Ratelimit | null>> = {};

function getLimiter(type: RateLimitType): Ratelimit | null {
  if (type in limiters) {
    return limiters[type] ?? null;
  }

  let limiter: Ratelimit | null = null;

  switch (type) {
    case 'auth':
      // 10 requests per 15 minutes
      limiter = createLimiter(10, 15 * 60);
      break;

    case 'otp_send':
      // 10 requests per 10 minutes
      limiter = createLimiter(10, 10 * 60);
      break;

    case 'otp_verify':
      // 15 requests per 10 minutes
      limiter = createLimiter(15, 10 * 60);
      break;

    case 'payment':
      // 10 requests per minute
      limiter = createLimiter(10, 60);
      break;

    case 'api':
      // 100 requests per minute
      limiter = createLimiter(100, 60);
      break;

    default:
      limiter = null;
  }

  limiters[type] = limiter;
  return limiter;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the given identifier has exceeded the rate limit for the
 * specified type. Returns `{ success: true, remaining: 999 }` as a graceful
 * fallback when Redis env vars are not configured (e.g. local dev).
 */
export async function rateLimit(
  identifier: string,
  type: RateLimitType
): Promise<{ success: boolean; remaining: number }> {
  const limiter = getLimiter(type);

  if (!limiter) {
    // Graceful fallback: allow all requests when not configured
    return { success: true, remaining: 999 };
  }

  try {
    const result = await limiter.limit(`${type}:${identifier}`);
    return {
      success: result.success,
      remaining: result.remaining,
    };
  } catch (err) {
    // If Redis is unreachable, allow the request rather than blocking the user
    console.error('[rate-limit] Error checking rate limit:', err);
    return { success: true, remaining: 999 };
  }
}
