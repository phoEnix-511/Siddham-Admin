import twilio from 'twilio';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured');
  }

  return twilio(accountSid, authToken);
}

/**
 * Normalise a phone number to E.164 format.
 *
 * Rules:
 * - Strip all non-digit characters.
 * - If 10 digits remain (Indian mobile), prepend +91.
 * - If the original string started with a country-code prefix (stripped to >10 digits), prepend +.
 * - Otherwise throw an error.
 */
function formatToE164(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    // Plain 10-digit Indian mobile number
    return `+91${digitsOnly}`;
  }

  if (digitsOnly.length > 10) {
    // Assumed to already contain a country code
    return `+${digitsOnly}`;
  }

  throw new Error(`Cannot format phone number to E.164: ${phone}`);
}

function generateOtp(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

const OTP_TTL_SECONDS = 600; // 10 minutes

function redisKey(phone: string): string {
  return `otp:${phone}`;
}

/**
 * Generate a 6-digit OTP, persist it in Redis, and send it via Twilio WhatsApp.
 */
export async function sendWhatsAppOtp(
  phone: string
): Promise<{ success: boolean; message: string }> {
  let e164Phone: string;

  try {
    e164Phone = formatToE164(phone);
  } catch (err) {
    console.error('[otp] Phone formatting error:', err);
    return { success: false, message: 'Invalid phone number format' };
  }

  const otp = generateOtp();

  try {
    await redis.set(redisKey(e164Phone), otp, { ex: OTP_TTL_SECONDS });
  } catch (err) {
    console.error('[otp] Redis set error:', err);
    return { success: false, message: 'Failed to store OTP. Please try again.' };
  }

  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    console.error('[otp] TWILIO_WHATSAPP_FROM is not set');
    return { success: false, message: 'WhatsApp sender not configured' };
  }

  try {
    const client = getTwilioClient();

    await client.messages.create({
      from,
      to: `whatsapp:${e164Phone}`,
      body: `Your Siddham Wellness verification code is: ${otp}. Valid for 10 minutes. 🌿`,
    });

    return { success: true, message: 'OTP sent to your WhatsApp' };
  } catch (err) {
    console.error('[otp] Twilio send error:', err);
    // Clean up the stored OTP so a retry generates a fresh one
    try {
      await redis.del(redisKey(e164Phone));
    } catch {
      // best-effort cleanup
    }
    return { success: false, message: 'Failed to send WhatsApp message. Please try again.' };
  }
}

/**
 * Verify the OTP supplied by the user.
 * Deletes the stored OTP on a successful match (one-time use).
 */
export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  let e164Phone: string;

  try {
    e164Phone = formatToE164(phone);
  } catch (err) {
    console.error('[otp] Phone formatting error during verify:', err);
    return false;
  }

  try {
    const stored = await redis.get<string>(redisKey(e164Phone));

    if (!stored) {
      return false;
    }

    if (stored !== otp) {
      return false;
    }

    // Correct OTP — delete it so it cannot be reused
    await redis.del(redisKey(e164Phone));
    return true;
  } catch (err) {
    console.error('[otp] Redis get error during verify:', err);
    return false;
  }
}
