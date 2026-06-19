import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

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
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // -------------------------------------------------------------------------
  // 2. Rate limit by IP
  // -------------------------------------------------------------------------
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown';

  const limit = await rateLimit(ip, 'auth');

  if (!limit.success) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  // -------------------------------------------------------------------------
  // 3. Check if email is already registered
  // -------------------------------------------------------------------------
  const existing = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    return res.status(409).json({
      error: 'An account with this email already exists. Please sign in.',
    });
  }

  // -------------------------------------------------------------------------
  // 4. Hash password
  // -------------------------------------------------------------------------
  const hashedPassword = await bcrypt.hash(password, 12);

  // -------------------------------------------------------------------------
  // 5. Create customer record
  // -------------------------------------------------------------------------
  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      hashedPassword: hashedPassword,
    },
    select: { id: true, name: true, email: true },
  });

  // -------------------------------------------------------------------------
  // 6. Send welcome email (non-blocking — errors are swallowed inside the util)
  // -------------------------------------------------------------------------
  void sendWelcomeEmail(customer.name || 'Valued Customer', customer.email);

  // -------------------------------------------------------------------------
  // 7. Respond
  // -------------------------------------------------------------------------
  return res.status(201).json({
    success: true,
    message: 'Account created. Please sign in.',
  });
}
