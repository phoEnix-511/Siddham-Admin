import { prisma } from '@/lib/prisma';

export interface WhatsAppCredentials {
  phoneNumberId: string | null;
  accessToken: string | null;
  otpTemplateName: string;
  orderConfirmationTemplateName: string;
  orderShippedTemplateName: string;
  orderDeliveredTemplateName: string;
  orderCancelledTemplateName: string;
  languageCode: string;
}

/**
 * Fetch WhatsApp credentials & template settings from env vars or database settings table.
 */
export async function getWhatsAppCredentials(): Promise<WhatsAppCredentials> {
  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN || null;
  let otpTemplateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'hello_world';
  let orderConfirmationTemplateName = process.env.WHATSAPP_ORDER_CONFIRMATION_TEMPLATE || 'jaspers_market_order_confirmation_v1';
  let orderShippedTemplateName = process.env.WHATSAPP_ORDER_SHIPPED_TEMPLATE || 'order_shipped';
  let orderDeliveredTemplateName = process.env.WHATSAPP_ORDER_DELIVERED_TEMPLATE || 'order_delivered';
  let orderCancelledTemplateName = process.env.WHATSAPP_ORDER_CANCELLED_TEMPLATE || 'order_cancelled';
  let languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';

  try {
    const dbSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'whatsapp_phone_number_id',
            'whatsapp_access_token',
            'whatsapp_otp_template',
            'whatsapp_order_confirmation_template',
            'whatsapp_order_shipped_template',
            'whatsapp_order_delivered_template',
            'whatsapp_order_cancelled_template',
            'whatsapp_template_language',
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    dbSettings.forEach((s) => { map[s.key] = s.value; });

    phoneNumberId = phoneNumberId || map['whatsapp_phone_number_id'] || null;
    accessToken = accessToken || map['whatsapp_access_token'] || null;
    otpTemplateName = map['whatsapp_otp_template'] || otpTemplateName;
    orderConfirmationTemplateName = map['whatsapp_order_confirmation_template'] || orderConfirmationTemplateName;
    orderShippedTemplateName = map['whatsapp_order_shipped_template'] || orderShippedTemplateName;
    orderDeliveredTemplateName = map['whatsapp_order_delivered_template'] || orderDeliveredTemplateName;
    orderCancelledTemplateName = map['whatsapp_order_cancelled_template'] || orderCancelledTemplateName;
    languageCode = map['whatsapp_template_language'] || languageCode;
  } catch (err) {
    console.error('[whatsapp] Failed to fetch settings from DB:', err);
  }

  return {
    phoneNumberId,
    accessToken,
    otpTemplateName,
    orderConfirmationTemplateName,
    orderShippedTemplateName,
    orderDeliveredTemplateName,
    orderCancelledTemplateName,
    languageCode,
  };
}

/**
 * Format recipient phone number for WhatsApp Cloud API (strip leading '+')
 */
export function formatWhatsAppRecipient(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Send a WhatsApp Cloud API Message using an approved template.
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en_US',
  bodyParameters = [],
}: {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: string[];
}): Promise<{ success: boolean; message: string; data?: any }> {
  const { phoneNumberId, accessToken } = await getWhatsAppCredentials();

  if (!phoneNumberId || !accessToken) {
    console.error('[whatsapp] Credentials not configured in env or DB');
    return { success: false, message: 'WhatsApp API credentials not configured' };
  }

  const cleanPhoneId = phoneNumberId.trim();
  if (cleanPhoneId.startsWith('+') || cleanPhoneId.startsWith('91')) {
    console.error(`[whatsapp] Invalid Phone Number ID: "${phoneNumberId}". Must be Meta Phone Number ID.`);
    return { success: false, message: 'Invalid Meta Phone Number ID configured' };
  }

  const recipient = formatWhatsAppRecipient(to);
  const url = `https://graph.facebook.com/v25.0/${cleanPhoneId}/messages`;

  const components: any[] = [];
  if (bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParameters.map((param) => ({
        type: 'text',
        text: String(param),
      })),
    });
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 ? { components } : {}),
    },
  };

  try {
    console.log(`[whatsapp] Sending template "${templateName}" to ${recipient}...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[whatsapp] Cloud API error response:', data);
      if (data.error?.code === 131030) {
        return {
          success: false,
          message: `Phone number ${recipient} not in Meta Test List. Add it under "To" in Meta Developer Portal or switch Meta App to Live Mode.`,
        };
      }
      if (data.error?.code === 133010 || data.error?.code === 131009 || data.error?.message?.toLowerCase().includes('not registered')) {
        return {
          success: false,
          message: `WhatsApp account not registered. Please ensure recipient (${recipient}) has WhatsApp active, and your sender Phone Number ID has completed 2FA registration in Meta Developer Console.`,
        };
      }
      return {
        success: false,
        message: data.error?.message || 'Failed to send WhatsApp template message',
      };
    }

    console.log(`[whatsapp] Template message "${templateName}" sent successfully to ${recipient}`);
    return { success: true, message: 'WhatsApp message sent', data };
  } catch (err: any) {
    console.error('[whatsapp] Unexpected fetch error:', err);
    return { success: false, message: err.message || 'WhatsApp fetch request failed' };
  }
}

/**
 * Send a free-form WhatsApp Cloud API Message (requires active 24h customer service window)
 */
export async function sendWhatsAppText({
  to,
  text,
}: {
  to: string;
  text: string;
}): Promise<{ success: boolean; message: string; data?: any }> {
  const { phoneNumberId, accessToken } = await getWhatsAppCredentials();

  if (!phoneNumberId || !accessToken) {
    return { success: false, message: 'WhatsApp API credentials not configured' };
  }

  const cleanPhoneId = phoneNumberId.trim();
  const recipient = formatWhatsAppRecipient(to);
  const url = `https://graph.facebook.com/v25.0/${cleanPhoneId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: { preview_url: false, body: text }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[whatsapp] Cloud API error response:', data);
      return { success: false, message: data.error?.message || 'Failed to send WhatsApp message' };
    }
    return { success: true, message: 'Message sent', data };
  } catch (err: any) {
    console.error('[whatsapp] Unexpected fetch error:', err);
    return { success: false, message: err.message || 'WhatsApp request failed' };
  }
}
