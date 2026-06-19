import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendOrderShippedEmail, sendOrderCancelledEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findUnique({
        where: { id: id as string },
        include: {
          customer: true,
          items: { include: { product: { include: { category: true } }, variant: true } },
        },
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.status(200).json({ order });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  if (req.method === 'PUT') {
    try {
      requireAdmin(req);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, paymentStatus, carrier, trackingNumber, cancellationReason, shippingAddress } = req.body;
    try {
      // 1. Fetch existing order to check status transition
      const existingOrder = await prisma.order.findUnique({
        where: { id: id as string },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      if (!existingOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // 2. Perform the update
      const updatedOrder = await prisma.order.update({
        where: { id: id as string },
        data: {
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
          ...(carrier !== undefined && { carrier }),
          ...(trackingNumber !== undefined && { trackingNumber }),
          ...(cancellationReason !== undefined && { cancellationReason }),
          ...(shippingAddress && { shippingAddress }),
        },
        include: {
          customer: true,
          items: { include: { product: { include: { category: true } }, variant: true } },
        },
      });

      // 3. Check for status transitions to trigger email
      const wasShipped = existingOrder.status !== 'SHIPPED' && updatedOrder.status === 'SHIPPED';
      const wasCancelled = existingOrder.status !== 'CANCELLED' && updatedOrder.status === 'CANCELLED';

      if (wasShipped || wasCancelled) {
        const orderEmailData = {
          orderNumber: updatedOrder.orderNumber,
          customerName: updatedOrder.customer.name || 'Valued Customer',
          customerEmail: updatedOrder.customer.email,
          items: updatedOrder.items.map(item => ({
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

        if (wasShipped) {
          const emailCarrier = updatedOrder.carrier || 'Delhivery';
          const emailTracking = updatedOrder.trackingNumber || 'N/A';
          sendOrderShippedEmail(orderEmailData, emailCarrier, emailTracking).catch(err => {
            console.error('[api/orders/[id]] Error sending shipped email:', err);
          });
        } else if (wasCancelled) {
          const emailReason = updatedOrder.cancellationReason || 'Admin cancellation';
          sendOrderCancelledEmail(orderEmailData, emailReason).catch(err => {
            console.error('[api/orders/[id]] Error sending cancelled email:', err);
          });
        }
      }

      return res.status(200).json({ order: updatedOrder });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update order' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
