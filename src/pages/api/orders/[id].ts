import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireEditorRole, requireViewerRole } from '@/lib/auth';
import { sendOrderShippedEmail, sendOrderCancelledEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    let adminRole = 'admin';
    try {
      const adminPayload = requireViewerRole(req);
      adminRole = adminPayload.role;
    } catch {
      // Also allow if the user is the customer themselves
      // But for admin API we expect viewer role.
    }
    try {
      const order = await prisma.order.findUnique({
        where: { id: id as string },
        include: {
          customer: true,
          items: { include: { product: { include: { category: true } }, variant: true } },
        },
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      
      if (adminRole === 'viewer') {
        order.shippingAddress = '*** MASKED ***';
        if (order.customer) {
          order.customer.name = order.customer.name.substring(0, 1) + '***';
          order.customer.email = '***@***.com';
          order.customer.phone = order.customer.phone ? '***' + order.customer.phone.slice(-4) : '***';
        }
      }

      return res.status(200).json({ order });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  if (req.method === 'PUT') {
    try {
      requireEditorRole(req);
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

      // State machine logic
      if (status && status !== existingOrder.status) {
        const current = existingOrder.status;
        const terminalStates = ['DELIVERED', 'CANCELLED', 'REFUNDED'];
        if (terminalStates.includes(current)) {
          return res.status(400).json({ error: `Cannot change status of a ${current} order.` });
        }
        
        if (status === 'CANCELLED' && ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(current)) {
          return res.status(400).json({ error: 'Order cannot be cancelled after it has been shipped or delivered.' });
        }
        
        const validNextStates: Record<string, string[]> = {
          PENDING: ['CONFIRMED', 'CANCELLED'],
          CONFIRMED: ['PROCESSING', 'CANCELLED'],
          PROCESSING: ['SHIPPED', 'CANCELLED'],
          SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
          OUT_FOR_DELIVERY: ['DELIVERED']
        };

        if (validNextStates[current] && !validNextStates[current].includes(status)) {
          return res.status(400).json({ error: `Invalid status transition from ${current} to ${status}. Expected one of: ${validNextStates[current].join(', ')}` });
        }
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
