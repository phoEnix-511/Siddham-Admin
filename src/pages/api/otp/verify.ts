import type { NextApiRequest, NextApiResponse } from 'next';
import { otpVerifySchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { verifyOtp } from '@/lib/otp';

type SuccessResponse = {
  success: true;
  verified: true;
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
  const parsed = otpVerifySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { phone, otp } = parsed.data;

  // -------------------------------------------------------------------------
  // 2. Rate limit by phone number
  // -------------------------------------------------------------------------
  const limit = await rateLimit(phone, 'otp_verify');

  if (!limit.success) {
    return res.status(429).json({
      error: 'Too many verification attempts. Please request a new OTP.',
    });
  }

  // -------------------------------------------------------------------------
  // 3. Verify OTP
  // -------------------------------------------------------------------------
  const isValid = await verifyOtp(phone, otp);

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  return res.status(200).json({ success: true, verified: true });
}
