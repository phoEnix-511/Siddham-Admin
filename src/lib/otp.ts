import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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

import { sendWhatsAppTemplate, getWhatsAppCredentials } from '@/lib/whatsapp';

/**
 * Generate a 6-digit OTP, persist it in Redis, and send it via WhatsApp Cloud API Template.
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

  const credentials = await getWhatsAppCredentials();
  
  if (!credentials.phoneNumberId || !credentials.accessToken) {
    console.error('[otp] WhatsApp Cloud API credentials are not set (WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN missing in env and DB)');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[otp] [DEV FALLBACK] OTP for ${e164Phone}: ${otp}`);
      return { success: true, message: `[DEV MODE] OTP generated: ${otp}` };
    }
    return { success: false, message: 'WhatsApp API credentials not configured. Please set them in Admin Settings or Environment Variables.' };
  }

  // Determine parameters based on template name
  // Default 'hello_world' has no parameters, custom OTP templates pass [otp]
  const isHelloWorld = credentials.otpTemplateName === 'hello_world';
  const bodyParameters = isHelloWorld ? [] : [otp];

  const result = await sendWhatsAppTemplate({
    to: e164Phone,
    templateName: credentials.otpTemplateName,
    languageCode: credentials.languageCode,
    bodyParameters,
  });

  if (!result.success) {
    console.error('[otp] WhatsApp template send failed:', result.message);
    try {
      await redis.del(redisKey(e164Phone));
    } catch {
      // best-effort cleanup
    }
    return { success: false, message: result.message };
  }

  return { success: true, message: 'OTP sent to your WhatsApp' };
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
