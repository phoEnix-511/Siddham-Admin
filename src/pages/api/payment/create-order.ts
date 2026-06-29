import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';

const getRazorpayInstance = async () => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, amount, receipt } = req.body;

  if (!orderId && !amount) {
    return res.status(400).json({ error: 'Either orderId or amount is required' });
  }

  try {
    const razorpay = await getRazorpayInstance();
    let finalAmount = 0;
    let finalReceipt = receipt || `rcpt_${Date.now()}`;
    let notes: Record<string, string> | undefined = undefined;

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      finalAmount = Math.round(order.totalAmount * 100);
      finalReceipt = order.orderNumber;
      notes = {
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    } else {
      finalAmount = Math.round(amount * 100);
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt: finalReceipt,
      notes,
    });

    if (orderId) {
      // Save Razorpay order ID
      await prisma.order.update({
        where: { id: orderId },
        data: { razorpayOrderId: razorpayOrder.id },
      });
    }

    return res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
}
