import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { delPattern } from "@/lib/cache";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    orderId, // Optional: for legacy flow
    items,
    customerName,
    customerEmail,
    customerPhone, // For new flow
    shippingAddress,
    notes,
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "Missing required payment fields" });
  }

  try {
    let keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!keySecret) {
      const dbSecret = await prisma.setting.findUnique({ where: { key: "razorpay_key_secret" } });
      keySecret = dbSecret?.value || "";
    }
    
    if (!keySecret) {
      console.error('[payment/verify] RAZORPAY_KEY_SECRET not configured');
      return res.status(500).json({ error: "Payment configuration error" });
    }

    // Verify Razorpay signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    const sigOk = expectedSignature.length === razorpaySignature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature));

    if (!sigOk) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Check for duplicate payment (replay attack prevention)
    const existingOrder = await prisma.order.findFirst({ where: { razorpayPaymentId } });
    if (existingOrder) {
      return res.status(409).json({ error: 'Payment already processed' });
    }

    // LEGACY: Update existing order if orderId provided
    if (orderId) {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          razorpayPaymentId,
          paymentMethod: "razorpay",
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      await Promise.all([
        delPattern("orders:list:"),
        delPattern("orders:detail:"),
        delPattern("account:orders:"),
        delPattern("reports:stock:"),
        delPattern("reports:sales:"),
      ]);

      return res.status(200).json({ success: true, order });
    }

    // NEW FLOW: Create order after payment verification
    if (!items?.length || !customerName || !customerEmail || !shippingAddress) {
      return res
        .status(400)
        .json({ error: "Missing order details for new order creation" });
    }

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: customerEmail },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: customerEmail,
          name: customerName,
          phone: customerPhone || null,
        },
      });
    }

    // Fetch products and variants
    const productIds = items.map((i: { productId: string }) => i.productId);
    const variantIds = items
      .map((i: { variantId?: string }) => i.variantId)
      .filter(Boolean) as string[];

    const [products, variants] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      variantIds.length > 0
        ? prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
        : Promise.resolve([]),
    ]);

    // Calculate order total and prepare items
    let totalAmount = 0;
    const orderItems = items.map(
      (item: { productId: string; variantId?: string; quantity: number }) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);

        if (item.variantId) {
          const variant = variants.find((v) => v.id === item.variantId);
          if (!variant) throw new Error(`Variant ${item.variantId} not found`);
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

    // Create order with payment details
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        razorpayOrderId,
        razorpayPaymentId,
        paymentMethod: "razorpay",
        paymentStatus: "PAID",
        status: "CONFIRMED",
        totalAmount: totalAmount + shippingAmount,
        shippingAmount,
        taxAmount: 0,
        shippingAddress,
        notes: notes || null,
        items: { create: orderItems },
      },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });

    // Now reduce stock (payment verified and order created)
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

    // Send WhatsApp order confirmation (non-blocking)
    if (customerPhone) {
      import("@/lib/whatsapp")
        .then(({ sendWhatsAppTemplate, getWhatsAppCredentials }) => {
          getWhatsAppCredentials().then((creds) => {
            const formattedTotal = String(order.totalAmount.toFixed(2));
            const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            sendWhatsAppTemplate({
              to: customerPhone,
              templateName: creds.orderConfirmationTemplateName,
              languageCode: creds.languageCode,
              bodyParameters: [customerName, order.orderNumber, formattedTotal, formattedDate],
            }).catch(err => console.error("[whatsapp] Order confirmation template error:", err));
          });
        })
        .catch(console.error);
    }

    return res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Payment verification error:", error);
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return res.status(500).json({ error: message });
  }
}
