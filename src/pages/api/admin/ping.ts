import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/auth";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const admin = requireAdmin(req);
    const redis = getRedis();
    
    if (redis) {
      const timestamp = Date.now();
      // Store admin detail as JSON string
      const memberData = JSON.stringify({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      });
      
      // Track active admin
      await redis.zadd("analytics:active_admins", { score: timestamp, member: memberData });
      
      // Cleanup old sessions (older than 5 minutes)
      const fiveMinutesAgo = timestamp - (5 * 60 * 1000);
      redis.zremrangebyscore("analytics:active_admins", 0, fiveMinutesAgo).catch(() => {});
    }
    
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
