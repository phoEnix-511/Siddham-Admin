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
    const [orderItems, waItems] = await Promise.all([
      redis.lrange("notifications:new_orders", 0, 50).catch(() => []),
      redis.lrange("notifications:whatsapp", 0, 50).catch(() => []),
    ]);

    const notifications: any[] = [];
    const allRaw = [...(Array.isArray(orderItems) ? orderItems : []), ...(Array.isArray(waItems) ? waItems : [])];
    
    for (const item of allRaw) {
      let parsed: any = null;
      if (typeof item === 'string') {
        try { parsed = JSON.parse(item); } catch (e) {}
      } else if (typeof item === 'object' && item !== null) {
        parsed = item;
      }
      if (parsed && (!sinceTimestamp || parsed.timestamp > sinceTimestamp)) {
        notifications.push(parsed);
      }
    }

    // Sort newest first
    notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    return res.status(200).json({ notifications: notifications.slice(0, 50) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
}
