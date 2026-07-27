import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';

async function getRazorpayKeys(): Promise<{ keyId: string; keySecret: string }> {
  let keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  let keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (!keyId || !keySecret) {
    try {
      const settings = await prisma.setting.findMany({
        where: { key: { in: ['razorpay_key_id', 'razorpay_key_secret'] } },
      });
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });

      keyId = keyId || map['razorpay_key_id'] || '';
      keySecret = keySecret || map['razorpay_key_secret'] || '';
    } catch (err) {
      console.error('[razorpay] Failed to fetch keys from DB:', err);
    }
  }

  return { keyId, keySecret };
}

const getRazorpayInstance = async () => {
  const { keyId, keySecret } = await getRazorpayKeys();
  return { razorpay: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId };
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
    const { razorpay, keyId } = await getRazorpayInstance();
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
      keyId,
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
}
