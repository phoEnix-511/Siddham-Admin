/**
 * src/lib/cache.ts
 * Centralised Redis cache utility (Upstash REST).
 * Reuses the same env vars as rate-limit.ts - no extra credentials needed.
 * Falls back gracefully when Redis is not configured.
 */

import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Cache-aside: try Redis first; on miss call fn(), store result, then return.
 */
export async function getOrSet<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached !== null && cached !== undefined) return cached;
    } catch (err) {
      console.error('[cache] read error:', err);
    }
  }
  const value = await fn();
  if (redis) {
    try {
      await redis.setex(key, ttl, value as any);
    } catch (err) {
      console.error('[cache] write error:', err);
    }
  }
  return value;
}

/** Delete a single key. */
export async function del(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try { await redis.del(key); }
  catch (err) { console.error('[cache] del error:', err); }
}

/**
 * Delete all keys beginning with prefix (SCAN-safe for large key-spaces).
 */
export async function delPattern(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    let cursor = 0;
    const pattern = prefix + '*';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = Number(nextCursor);
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== 0);
  } catch (err) {
    console.error('[cache] delPattern error:', err);
  }
}

export const cache = { getOrSet, del, delPattern };
export async function setFlag(key: string, ttl: number): Promise<void> {
  const redis = getRedis();
  if (redis) await redis.setex(key, ttl, '1');
}
export async function getFlag(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  return await redis.get(key) === '1';
}
