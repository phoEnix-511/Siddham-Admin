import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { getRazorpayInstance } from '@/lib/razorpay';
import { delPattern } from '@/lib/cache';
import { sendOrderCancelledEmail } from '@/lib/email';
import { getWhatsAppCredentials, sendWhatsAppTemplate } from '@/lib/whatsapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    requireSuperAdmin(req);
  } catch (err: any) {
    return res.status(err.message?.includes('Forbidden') ? 403 : 401).json({ error: err.message });
  }

  const { id } = req.query;
  const { amount, reason, orderStatus } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: { customer: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        error: 'Cannot process refund: This order does not have an associated Razorpay Payment ID.',
      });
    }

    if (order.paymentStatus === 'REFUNDED') {
      return res.status(400).json({
        error: 'This order has already been fully refunded.',
      });
    }

    // Determine refund amount
    const refundAmount = amount ? Number(amount) : order.totalAmount;
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({ error: 'Invalid refund amount.' });
    }

    if (refundAmount > order.totalAmount) {
      return res.status(400).json({
        error: `Refund amount (₹${refundAmount}) cannot exceed total order amount (₹${order.totalAmount}).`,
      });
    }

    // Initialize Razorpay
    const { razorpay } = await getRazorpayInstance();

    // Call Razorpay Refund API
    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100), // in paise
      speed: 'normal',
      notes: {
        reason: reason || 'Customer refund initiated via Admin Dashboard',
        orderNumber: order.orderNumber,
        orderId: order.id,
      },
    });

    const isFullRefund = refundAmount >= order.totalAmount;
    
    // Determine the next status for the order
    let nextStatus = order.status;
    if (orderStatus === 'CANCELLED') {
      nextStatus = 'CANCELLED';
    } else if (orderStatus === 'REFUNDED') {
      nextStatus = 'REFUNDED';
    } else if (orderStatus === 'KEEP') {
      nextStatus = order.status;
    } else if (isFullRefund) {
      nextStatus = 'CANCELLED'; // Default to cancelled for a full refund if not specified
    }

    // Update order in database
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: isFullRefund ? 'REFUNDED' : 'PAID',
        status: nextStatus as any,
        cancellationReason: reason 
          ? `Refunded ₹${refundAmount} (ID: ${refund.id}): ${reason}` 
          : `Refunded ₹${refundAmount} (ID: ${refund.id})`,
      },
      include: { customer: true, items: { include: { product: true } } },
    });

    // Invalidate caches
    await Promise.all([
      delPattern('orders:list:'),
      delPattern('orders:detail:'),
      delPattern('account:orders:'),
      delPattern('reports:'),
    ]);

    // Send cancellation notifications if status changed to CANCELLED
    if (order.status !== 'CANCELLED' && nextStatus === 'CANCELLED') {
      const orderEmailData = {
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customer?.name || "Valued Customer",
        customerEmail: updatedOrder.customer.email,
        items: updatedOrder.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: updatedOrder.totalAmount,
        shippingAmount: updatedOrder.shippingAmount,
        shippingAddress: typeof updatedOrder.shippingAddress === 'string'
            ? JSON.parse(updatedOrder.shippingAddress)
            : (updatedOrder.shippingAddress as any),
      };

      const emailReason = updatedOrder.cancellationReason || "Admin cancellation via refund";
      
      sendOrderCancelledEmail(orderEmailData, emailReason).catch(console.error);

      if (updatedOrder.customer?.phone) {
        getWhatsAppCredentials().then((creds) => {
          sendWhatsAppTemplate({
            to: updatedOrder.customer.phone!,
            templateName: creds.orderCancelledTemplateName,
            languageCode: creds.languageCode,
            bodyParameters: [orderEmailData.customerName, updatedOrder.orderNumber, emailReason],
          }).catch(console.error);
        }).catch(console.error);
      }
    }

    return res.status(200).json({
      success: true,
      refundId: refund.id,
      refundAmount,
      message: `Successfully processed refund of ₹${refundAmount} (Razorpay Refund ID: ${refund.id})`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Razorpay refund error:', error);
    const description =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      'Failed to process refund with Razorpay';
    return res.status(500).json({ error: description });
  }
}
