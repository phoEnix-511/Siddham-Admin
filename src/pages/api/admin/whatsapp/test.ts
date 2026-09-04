import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminRole } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    requireAdminRole(req);
  } catch (err: any) {
    return res.status(err.message.includes('Forbidden') ? 403 : 401).json({ error: err.message });
  }

  const { phone_number_id, access_token } = req.body;

  if (!phone_number_id || !access_token) {
    return res.status(400).json({ success: false, error: 'Phone Number ID and Access Token are required.' });
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${phone_number_id}?fields=display_phone_number,verified_name`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp Test Error:', data);
      return res.status(400).json({ 
        success: false, 
        error: data.error?.message || 'Failed to authenticate with WhatsApp Cloud API.'
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('WhatsApp Test Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
