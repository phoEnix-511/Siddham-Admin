import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/auth";
import { Redis } from "@upstash/redis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  
  try {
    requireAdmin(req);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { since = "0" } = req.query;
  const sinceTimestamp = parseInt(since as string);

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return res.status(200).json({ notifications: [] });
  }
  
  try {
    const redis = new Redis({ url, token });
    const items = await redis.lrange("notifications:new_orders", 0, 50);
    const notifications = [];
    
    for (const item of items) {
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          if (parsed.timestamp > sinceTimestamp) {
            notifications.push(parsed);
          }
        } catch (e) {}
      } else if (typeof item === 'object' && item !== null) {
        if ((item as any).timestamp > sinceTimestamp) {
          notifications.push(item);
        }
      }
    }
    
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
}
