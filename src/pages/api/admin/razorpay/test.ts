import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminRole } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    requireAdminRole(req);
  } catch (err: any) {
    return res.status(err.message.includes('Forbidden') ? 403 : 401).json({ error: err.message });
  }

  const { key_id, key_secret } = req.body;

  const cleanKeyId = (key_id || '').trim();
  const cleanKeySecret = (key_secret || '').trim();

  if (!cleanKeyId || !cleanKeySecret) {
    return res.status(400).json({
      success: false,
      error: 'Both Razorpay Key ID and Key Secret are required.',
    });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${cleanKeyId}:${cleanKeySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/payments?count=1', {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay test connection error:', data);
      const description = data?.error?.description || data?.message || 'Authentication failed';
      return res.status(400).json({
        success: false,
        error: `Razorpay Error: ${description}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully connected to Razorpay! Key ID: ${cleanKeyId.substring(0, 10)}...`,
    });
  } catch (error: any) {
    console.error('Razorpay test fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while connecting to Razorpay.',
    });
  }
}
