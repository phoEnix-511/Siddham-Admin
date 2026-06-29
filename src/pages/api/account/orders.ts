import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    // Get pagination parameters
    const { page = "1", limit = "10" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    // Get customer and their orders with pagination
    const [customer, totalCount] = await Promise.all([
      prisma.customer.findUnique({
        where: { email: session.user.email },
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
        where: { customer: { email: session.user.email } },
      }),
    ]);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.status(200).json({
      orders: customer.orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
}
