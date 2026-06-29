import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireViewerRole } from "@/lib/auth";

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

  const { startDate, endDate } = req.query;

  const where: Record<string, unknown> = {
    paymentStatus: "PAID",
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate)
      (where.createdAt as Record<string, Date>).gte = new Date(
        startDate as string,
      );
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, Date>).lte = end;
    }
  }

  try {
    // Database-side aggregation for daily summary
    const dailyStatsRaw = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as orders,
        SUM("totalAmount") as revenue
      FROM "Order"
      WHERE "paymentStatus" = 'PAID'
        ${startDate ? `AND "createdAt" >= '${new Date(startDate as string).toISOString()}'::timestamp` : ""}
        ${endDate ? `AND "createdAt" <= '${new Date(endDate as string).toISOString()}'::timestamp` : ""}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const daily = dailyStatsRaw.map((row) => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : row.date,
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    }));

    // Product-level breakdown using database aggregation
    const productBreakdownRaw = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as quantity,
        SUM(oi.quantity * oi.price) as revenue
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."paymentStatus" = 'PAID'
        ${startDate ? `AND o."createdAt" >= '${new Date(startDate as string).toISOString()}'::timestamp` : ""}
        ${endDate ? `AND o."createdAt" <= '${new Date(endDate as string).toISOString()}'::timestamp` : ""}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
    `;

    const productBreakdown = productBreakdownRaw.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity),
      revenue: Number(row.revenue),
    }));

    // Total revenue and order count
    const totalStats = await prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: true,
    });

    const totalRevenue = totalStats._sum.totalAmount || 0;
    const totalOrders = totalStats._count;

    // Get orders for CSV export (paginated to avoid memory issues)
    const orders = await prisma.order.findMany({
      where,
      select: {
        orderNumber: true,
        createdAt: true,
        totalAmount: true,
        paymentStatus: true,
        status: true,
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 1000, // Limit to 1000 for CSV export
    });

    // Format for CSV download
    const csv = [
      "Order Number,Date,Customer,Email,Phone,Products,Total (INR),Payment Status,Order Status",
      ...orders.map((o) =>
        [
          o.orderNumber,
          o.createdAt.toISOString().split("T")[0],
          o.customer.name,
          o.customer.email,
          o.customer.phone || "",
          o.items.map((i) => `${i.product.name} x${i.quantity}`).join("; "),
          o.totalAmount.toFixed(2),
          o.paymentStatus,
          o.status,
        ].join(","),
      ),
    ].join("\n");

    return res
      .status(200)
      .json({ totalRevenue, totalOrders, daily, productBreakdown, csv });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to generate sales report" });
  }
}
