import type { NextApiRequest, NextApiResponse } from 'next';
import { otpSendSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { sendWhatsAppOtp } from '@/lib/otp';

type SuccessResponse = {
  success: true;
  message: string;
};

type ErrorResponse = {
  error: string;
  details?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // -------------------------------------------------------------------------
  // 1. Validate request body
  // -------------------------------------------------------------------------
  const parsed = otpSendSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { phone } = parsed.data;

  // -------------------------------------------------------------------------
  // 2. Rate limit by phone number
  // -------------------------------------------------------------------------
  const limit = await rateLimit(phone, 'otp_send');

  if (!limit.success) {
    return res.status(429).json({
      error: 'Too many OTP requests. Please wait before requesting a new code.',
    });
  }

  // -------------------------------------------------------------------------
  // 3. Send OTP via WhatsApp
  // -------------------------------------------------------------------------
  const result = await sendWhatsAppOtp(phone);

  if (!result.success) {
    return res.status(500).json({ error: result.message });
  }

  return res.status(200).json({
    success: true,
    message: 'OTP sent to your WhatsApp',
  });
}
