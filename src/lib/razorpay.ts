import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';

export async function getRazorpayKeys(): Promise<{ keyId: string; keySecret: string }> {
  let dbKeyId = '';
  let dbKeySecret = '';

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['razorpay_key_id', 'razorpay_key_secret'] } },
    });
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });

    dbKeyId = (map['razorpay_key_id'] || '').trim();
    dbKeySecret = (map['razorpay_key_secret'] || '').trim();
  } catch (err) {
    console.error('[razorpay] Failed to fetch keys from DB:', err);
  }

  if (dbKeyId && dbKeySecret) {
    return { keyId: dbKeyId, keySecret: dbKeySecret };
  }

  const envKeyId = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim();
  const envKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  return {
    keyId: dbKeyId || envKeyId,
    keySecret: dbKeySecret || envKeySecret,
  };
}

export async function getRazorpayInstance(): Promise<{ razorpay: Razorpay; keyId: string; keySecret: string }> {
  const { keyId, keySecret } = await getRazorpayKeys();

  if (!keyId || !keySecret) {
    throw new Error(
      `Razorpay keys are missing. Key ID: ${keyId ? 'configured' : 'missing'}, Secret: ${keySecret ? 'configured' : 'missing'}.`
    );
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return { razorpay, keyId, keySecret };
}
