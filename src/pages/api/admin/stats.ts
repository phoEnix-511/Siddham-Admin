import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireViewerRole } from "@/lib/auth";
import { getOrSet } from "@/lib/cache";
import { Redis } from "@upstash/redis";

const STATS_CACHE_KEY = "admin:dashboard:stats:v1";
const STATS_CACHE_TTL = 60 * 5; // 5 minutes

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    requireViewerRole(req);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const forceRefresh = req.query.refresh === "true";

    const fetchFresh = async () => {
      const [
        totalProducts,
        totalOrders,
        totalCustomers,
        revenueResult,
        recentOrders,
        lowStockProducts,
        pendingOrders,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.customer.count(),
        prisma.order.aggregate({
          where: { paymentStatus: "PAID" },
          _sum: { totalAmount: true },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            customer: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.product.findMany({
          where: { stock: { lte: 10 } },
          orderBy: { stock: "asc" },
          take: 5,
          select: {
            id: true,
            name: true,
            stock: true,
            category: { select: { id: true, name: true } },
          },
        }),
        prisma.order.count({ where: { status: "PENDING" } }),
      ]);

      return {
        stats: {
          totalProducts,
          totalOrders,
          totalCustomers,
          totalRevenue: revenueResult._sum.totalAmount || 0,
          pendingOrders,
        },
        recentOrders,
        lowStockProducts,
      };
    };

    const result = forceRefresh
      ? await fetchFresh()
      : await getOrSet(STATS_CACHE_KEY, STATS_CACHE_TTL, fetchFresh);

    // Fetch real-time metrics directly (never cache these)
    let activeUsers = 0;
    let activeCarts = 0;
    const redis = getRedis();
    if (redis) {
      const timestamp = Date.now();
      const fiveMinutesAgo = timestamp - (5 * 60 * 1000);
      try {
        const [usersCount, cartsCount] = await Promise.all([
          redis.zcount("analytics:active_users", fiveMinutesAgo, timestamp),
          redis.zcount("analytics:active_carts", fiveMinutesAgo, timestamp)
        ]);
        activeUsers = usersCount;
        activeCarts = cartsCount;
      } catch (err) {
        console.error("[stats] failed to fetch real-time metrics", err);
      }
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ...result, liveMetrics: { activeUsers, activeCarts } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}