import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireViewerRole } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { getOrSet, delPattern } from "@/lib/cache";

const ORDER_LIST_CACHE_TTL = 30; // 30 seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    let adminRole = "admin";
    try {
      const adminPayload = requireViewerRole(req);
      adminRole = adminPayload.role;
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { status, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const cacheKey = `orders:list:${adminRole}:${status || "all"}:${pageNum}:${limitNum}`;
    const fetchFresh = async () => {
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            updatedAt: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            shippingAddress: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            items: {
              select: {
                id: true,
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
                    sku: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.order.count({ where }),
      ]);

      const maskedOrders = orders.map((order) => {
        if (adminRole === "viewer") {
          return {
            ...order,
            shippingAddress: "*** MASKED ***",
            customer: order.customer
              ? {
                  ...order.customer,
                  name: order.customer.name?.substring(0, 1) + "***",
                  email: "***@***.com",
                  phone: order.customer.phone
                    ? "***" + order.customer.phone.slice(-4)
                    : null,
                }
              : null,
          };
        }
        return order;
      });

      return {
        orders: maskedOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    };

    const result = await getOrSet(cacheKey, ORDER_LIST_CACHE_TTL, fetchFresh);
    res.setHeader(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=120",
    );

    return res.status(200).json(result);
  }

  if (req.method === "POST") {
    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      notes,
    } = req.body;

    if (!items?.length || !customerName || !customerEmail || !shippingAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Find or create customer
      let customer = await prisma.customer.findUnique({
        where: { email: customerEmail },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            email: customerEmail,
            name: customerName,
            phone: customerPhone,
          },
        });
      }

      // Fetch products and variants, and calculate total
      const productIds = items.map((i: { productId: string }) => i.productId);
      const variantIds = items
        .map((i: { variantId?: string }) => i.variantId)
        .filter(Boolean) as string[];

      const [products, variants] = await Promise.all([
        prisma.product.findMany({ where: { id: { in: productIds } } }),
        variantIds.length > 0
          ? prisma.productVariant.findMany({
              where: { id: { in: variantIds } },
            })
          : Promise.resolve([]),
      ]);

      let totalAmount = 0;
      const orderItems = items.map(
        (item: { productId: string; variantId?: string; quantity: number }) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) throw new Error(`Product ${item.productId} not found`);

          if (item.variantId) {
            const variant = variants.find((v) => v.id === item.variantId);
            if (!variant)
              throw new Error(`Variant ${item.variantId} not found`);
            if (variant.stock < item.quantity) {
              throw new Error(
                `Insufficient stock for ${product.name} (${variant.name})`,
              );
            }
            totalAmount += variant.price * item.quantity;
            return {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: variant.price,
            };
          } else {
            if (product.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${product.name}`);
            }
            totalAmount += product.price * item.quantity;
            return {
              productId: item.productId,
              variantId: null,
              quantity: item.quantity,
              price: product.price,
            };
          }
        },
      );

      const shippingAmount = totalAmount >= 999 ? 0 : 99;
      const taxAmount = 0; // GST can be added later

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          totalAmount: totalAmount + shippingAmount,
          shippingAmount,
          taxAmount,
          shippingAddress,
          notes: notes || null,
          items: { create: orderItems },
        },
        include: {
          customer: true,
          items: { include: { product: true, variant: true } },
        },
      });

      // Batch reduce stock
      const variantUpdates: Array<{ id: string; quantity: number }> = (
        items as any[]
      )
        .filter((i: any) => i.variantId)
        .map((i: any) => ({
          id: i.variantId,
          quantity: i.quantity,
        }));
      const productUpdates: Array<{ id: string; quantity: number }> = (
        items as any[]
      )
        .filter((i: any) => !i.variantId)
        .map((i: any) => ({
          id: i.productId,
          quantity: i.quantity,
        }));

      if (variantUpdates.length > 0) {
        await Promise.all(
          variantUpdates.map((update) =>
            prisma.productVariant.update({
              where: { id: update.id },
              data: { stock: { decrement: update.quantity } },
            }),
          ),
        );
      }
      if (productUpdates.length > 0) {
        await Promise.all(
          productUpdates.map((update) =>
            prisma.product.update({
              where: { id: update.id },
              data: { stock: { decrement: update.quantity } },
            }),
          ),
        );
      }

      await Promise.all([
        delPattern("orders:list:"),
        delPattern("orders:detail:"),
        delPattern("account:orders:"),
        delPattern("reports:stock:"),
        delPattern("reports:sales:"),
      ]);

      // Send order confirmation email (non-blocking)
      import("@/lib/email")
        .then(({ sendOrderConfirmationEmail }) => {
          sendOrderConfirmationEmail({
            orderNumber: order.orderNumber,
            customerName: customerName,
            customerEmail: customerEmail,
            items: order.items.map((i) => ({
              name: i.product.name + (i.variant ? ` (${i.variant.name})` : ""),
              quantity: i.quantity,
              price: i.price,
            })),
            totalAmount: order.totalAmount,
            shippingAmount: order.shippingAmount,
            shippingAddress: shippingAddress,
          });
        })
        .catch(console.error);

      return res.status(201).json({ order });
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Failed to create order";
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
