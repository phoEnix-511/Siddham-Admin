import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getOrSet } from "@/lib/cache";

const STATS_CACHE_KEY = "admin:dashboard:stats:v1";
const STATS_CACHE_TTL = 60 * 5; // 5 minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    requireAdmin(req);
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

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}