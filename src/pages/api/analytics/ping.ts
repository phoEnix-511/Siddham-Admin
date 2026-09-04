import type { NextApiRequest, NextApiResponse } from "next";
import { getOrSet } from "@/lib/cache";
import { Redis } from "@upstash/redis";

// Reuse the cache utility's approach to Redis
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sessionId, path, cartCount } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  const redis = getRedis();
  if (!redis) {
    // If Redis isn't configured, just fail silently to not break the frontend
    return res.status(200).json({ success: true, warning: "Redis not configured" });
  }

  try {
    const timestamp = Date.now();
    
    // 1. Track active session (expires after 5 minutes of inactivity)
    // We use a sorted set where score is the timestamp
    await redis.zadd("analytics:active_users", { score: timestamp, member: sessionId });
    
    // 2. Track cart sessions separately if cartCount > 0
    if (cartCount && parseInt(cartCount) > 0) {
      await redis.zadd("analytics:active_carts", { score: timestamp, member: sessionId });
    } else {
      // If they emptied their cart, remove them from active carts
      await redis.zrem("analytics:active_carts", sessionId);
    }

    // 3. Track page views (all time, can be reset by cron or left rolling)
    if (path) {
      // Clean path to prevent fragmentation (e.g. remove query params if needed, but path from router is usually just path)
      await redis.zincrby("analytics:pages", 1, path);
    }

    // 4. Cleanup old sessions (older than 5 minutes) asynchronously
    // This keeps the sets small without blocking the ping response
    const fiveMinutesAgo = timestamp - (5 * 60 * 1000);
    Promise.all([
      redis.zremrangebyscore("analytics:active_users", 0, fiveMinutesAgo),
      redis.zremrangebyscore("analytics:active_carts", 0, fiveMinutesAgo)
    ]).catch(err => console.error("[analytics] cleanup error:", err));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[analytics] ping error:", error);
    return res.status(500).json({ error: "Failed to process analytics ping" });
  }
}