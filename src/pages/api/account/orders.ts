import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import { getOrSet } from "@/lib/cache";

const ACCOUNT_ORDERS_CACHE_TTL = 30; // 30 seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Get pagination parameters
    const { page = "1", limit = "10" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `account:orders:${email}:${pageNum}:${limitNum}`;
    const fetchFresh = async () => {
      const [customer, totalCount] = await Promise.all([
        prisma.customer.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            orders: {
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                status: true,
                paymentStatus: true,
                totalAmount: true,
                items: {
                  select: {
                    quantity: true,
                    price: true,
                    product: {
                      select: {
                        id: true,
                        name: true,
                        sku: true,
                      },
                    },
                    variant: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              skip,
              take: limitNum,
            },
          },
        }),
        prisma.order.count({
          where: { customer: { email } },
        }),
      ]);

      if (!customer) {
        return null;
      }

      return {
        orders: customer.orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      };
    };

    const result = await getOrSet(
      cacheKey,
      ACCOUNT_ORDERS_CACHE_TTL,
      fetchFresh,
    );
    if (!result) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.setHeader(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=120",
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
}
