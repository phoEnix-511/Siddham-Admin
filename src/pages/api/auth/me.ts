import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFromRequest } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.status(200).json({ admin });
}
