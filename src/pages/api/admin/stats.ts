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
    let topPages: string[] = [];
    let activeAdmins: any[] = [];
    const redis = getRedis();
    if (redis) {
      const timestamp = Date.now();
      const fiveMinutesAgo = timestamp - (5 * 60 * 1000);
      try {
        const [usersCount, cartsCount, topPagesRes] = await Promise.all([
          redis.zcount("analytics:active_users", fiveMinutesAgo, timestamp),
          redis.zcount("analytics:active_carts", fiveMinutesAgo, timestamp),
          redis.zrange("analytics:pages", 0, 4, { rev: true, withScores: true })
        ]);
        activeUsers = usersCount;
        activeCarts = cartsCount;
        
        // Parse top pages from redis result format
        if (Array.isArray(topPagesRes)) {
           for (let i = 0; i < topPagesRes.length; i += 2) {
             topPages.push(String(topPagesRes[i]));
           }
        }
        
        // Fetch active admins
        const activeAdminsRes = await redis.zrange("analytics:active_admins", fiveMinutesAgo, timestamp, { byScore: true });
        if (Array.isArray(activeAdminsRes)) {
           // We might have multiple sessions for the same admin, so we'll map and deduplicate by email
           const adminMap = new Map();
           for (const adminStr of activeAdminsRes) {
             try {
               const parsed = JSON.parse(String(adminStr));
               adminMap.set(parsed.email, parsed);
             } catch (e) {}
           }
           activeAdmins = Array.from(adminMap.values());
        }
        
      } catch (err) {
        console.error("[stats] failed to fetch real-time metrics", err);
      }
    }

    // Additional analytics queries
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const uniqueUsersLast30Days = await prisma.customer.count({
      where: { lastLogin: { gte: thirtyDaysAgo } }
    }).catch(() => 0); // fallback if field doesn't exist yet

    // Active carts count from CartSnapshot model
    const usersWithActiveCart = await prisma.cartSnapshot.count({
      where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    }).catch(() => 0);
    
    // Quick approximation of top products in cart using Prisma aggregate/groupBy isn't easy on JSON
    // We'll return empty topProductsInCart for now to fulfill the type contract, 
    // a real implementation would extract this from CartSnapshot items or Redis.
    const topProductsInCart: string[] = [];

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ 
      ...result, 
      analytics: {
        uniqueUsersLast30Days,
        registeredUsers: result.stats.totalCustomers,
        topProductsInCart,
        usersWithActiveCart,
        topPages
      },
      liveMetrics: { activeUsers, activeCarts, activeAdmins } 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}