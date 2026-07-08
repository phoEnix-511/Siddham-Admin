import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAmount: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.zoho.in';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return null;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: any }> {
  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || 'support@siddhamwellness.com';

  if (transporter) {
    try {
      console.log(`[email] Attempting to send email via SMTP (${process.env.SMTP_HOST || 'smtp.zoho.in'}) to: ${to}`);
      await transporter.sendMail({
        from: `"Siddham Wellness" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      console.log(`[email] Email sent successfully via SMTP to: ${to}`);
      return { success: true };
    } catch (err) {
      console.error('[email] SMTP failed, falling back to Resend:', err);
    }
  }

  // Fallback to Resend
  try {
    console.log(`[email] Attempting to send email via Resend to: ${to}`);
    const fromResend = process.env.RESEND_FROM || 'Siddham Wellness <orders@resend.dev>';
    const { error } = await resend.emails.send({
      from: fromResend,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[email] Resend failed:', error);
      return { success: false, error };
    }
    console.log(`[email] Email sent successfully via Resend to: ${to}`);
    return { success: true };
  } catch (err) {
    console.error('[email] Resend unexpected error:', err);
    return { success: false, error: err };
  }
}

function buildOrderConfirmationHtml(order: OrderEmailData): string {
  const subtotal = order.totalAmount - order.shippingAmount;

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e8e0d5; color: #2d2d2d; font-size: 14px;">
            ${item.name}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e8e0d5; text-align: center; color: #5a5a5a; font-size: 14px;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e8e0d5; text-align: right; color: #2d2d2d; font-size: 14px;">
            ${formatCurrency(item.price)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e8e0d5; text-align: right; color: #2d2d2d; font-size: 14px; font-weight: 600;">
            ${formatCurrency(item.price * item.quantity)}
          </td>
        </tr>
      `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation – Siddham Wellness</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0e8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3d2b; padding: 36px 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <p style="margin: 0; font-size: 28px; color: #ffffff; font-family: Georgia, serif; font-weight: 700; letter-spacing: 1px;">
                🌿 Siddham Wellness
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #a8c4b0; font-family: Arial, sans-serif; letter-spacing: 2px; text-transform: uppercase;">
                Ancient Wisdom, Modern Wellness
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 32px;">
              <p style="margin: 0 0 8px; font-size: 22px; color: #1a3d2b; font-family: Georgia, serif; font-weight: 700;">
                Thank you, ${order.customerName}!
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #5a5a5a; font-family: Arial, sans-serif; line-height: 1.6;">
                Your order has been placed successfully. We'll get it packed with care and ship it your way soon.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #fdf6ec; border: 1.5px solid #c4852a; border-radius: 6px; padding: 16px 20px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #7a6340; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1.5px;">
                      Order Number
                    </p>
                    <p style="margin: 6px 0 0; font-size: 24px; color: #c4852a; font-family: Georgia, serif; font-weight: 700; letter-spacing: 2px;">
                      #${order.orderNumber}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px; font-size: 14px; color: #1a3d2b; font-family: Arial, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Order Summary
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e8e0d5; border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f5f0e8;">
                    <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #7a6340; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                      Product
                    </th>
                    <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #7a6340; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                      Qty
                    </th>
                    <th style="padding: 10px 16px; text-align: right; font-size: 12px; color: #7a6340; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                      Unit Price
                    </th>
                    <th style="padding: 10px 16px; text-align: right; font-size: 12px; color: #7a6340; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #5a5a5a; font-family: Arial, sans-serif;">Subtotal</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #2d2d2d; font-family: Arial, sans-serif; text-align: right;">${formatCurrency(subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #5a5a5a; font-family: Arial, sans-serif;">Shipping</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #2d2d2d; font-family: Arial, sans-serif; text-align: right;">
                          ${order.shippingAmount === 0 ? '<span style="color:#1a3d2b; font-weight:600;">FREE</span>' : formatCurrency(order.shippingAmount)}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 8px 0 0; border-top: 2px solid #1a3d2b;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0 0; font-size: 16px; color: #1a3d2b; font-family: Georgia, serif; font-weight: 700;">Total</td>
                        <td style="padding: 8px 0 0; font-size: 16px; color: #1a3d2b; font-family: Georgia, serif; font-weight: 700; text-align: right;">
                          ${formatCurrency(order.totalAmount)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px; font-size: 14px; color: #1a3d2b; font-family: Arial, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Shipping Address
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #f5f0e8; border-left: 3px solid #1a3d2b; padding: 16px 20px; border-radius: 0 4px 4px 0;">
                    <p style="margin: 0; font-size: 14px; color: #2d2d2d; font-family: Arial, sans-serif; line-height: 1.8;">
                      ${order.customerName}<br />
                      ${order.shippingAddress.address}<br />
                      ${order.shippingAddress.city}, ${order.shippingAddress.state} – ${order.shippingAddress.pincode}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1a3d2b; padding: 28px 40px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #a8c4b0; font-family: Arial, sans-serif; font-style: italic; letter-spacing: 1px;">
                Ancient Wisdom, Modern Wellness
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b9e7a; font-family: Arial, sans-serif;">
                🌿 Siddham Wellness &nbsp;|&nbsp; Questions? Reply to this email
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildWelcomeHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Siddham Wellness</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0e8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3d2b; padding: 36px 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <p style="margin: 0; font-size: 28px; color: #ffffff; font-family: Georgia, serif; font-weight: 700; letter-spacing: 1px;">
                🌿 Siddham Wellness
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #a8c4b0; font-family: Arial, sans-serif; letter-spacing: 2px; text-transform: uppercase;">
                Ancient Wisdom, Modern Wellness
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 48px 40px 40px;">
              <p style="margin: 0 0 16px; font-size: 26px; color: #1a3d2b; font-family: Georgia, serif; font-weight: 700;">
                Welcome, ${name}! 🙏
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #5a5a5a; font-family: Arial, sans-serif; line-height: 1.7;">
                We're delighted to have you join the Siddham Wellness family. Your account has been created successfully.
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #5a5a5a; font-family: Arial, sans-serif; line-height: 1.7;">
                Explore our curated range of authentic Ayurvedic products — rooted in ancient wisdom and crafted for the modern lifestyle.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td style="background-color: #1a3d2b; border-radius: 6px;">
                    <a href="${process.env.NEXTAUTH_URL ?? 'https://siddhamwellness.com'}/shop"
                       style="display: inline-block; padding: 14px 32px; font-size: 15px; color: #ffffff; font-family: Arial, sans-serif; font-weight: 600; text-decoration: none; letter-spacing: 0.5px;">
                      Explore Our Products →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 13px; color: #9a9a9a; font-family: Arial, sans-serif; line-height: 1.6;">
                If you didn't create this account, please ignore this email or contact us immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1a3d2b; padding: 28px 40px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #a8c4b0; font-family: Arial, sans-serif; font-style: italic; letter-spacing: 1px;">
                Ancient Wisdom, Modern Wellness
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b9e7a; font-family: Arial, sans-serif;">
                🌿 Siddham Wellness &nbsp;|&nbsp; Reply to this email for support
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildOrderShippedHtml(order: OrderEmailData, carrier: string, trackingNumber: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Order Has Shipped! – Siddham Wellness</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0e8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3d2b; padding: 36px 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <p style="margin: 0; font-size: 28px; color: #ffffff; font-family: Georgia, serif; font-weight: 700; letter-spacing: 1px;">
                🌿 Siddham Wellness
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #a8c4b0; font-family: Arial, sans-serif; letter-spacing: 2px; text-transform: uppercase;">
                Ancient Wisdom, Modern Wellness
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 32px;">
              <p style="margin: 0 0 8px; font-size: 22px; color: #1a3d2b; font-family: Georgia, serif; font-weight: 700;">
                Your order is on its way, ${order.customerName}! 🚚
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #5a5a5a; font-family: Arial, sans-serif; line-height: 1.6;">
                Great news! We have shipped your order. You can track its progress using the details below.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #fdf6ec; border: 1.5px solid #c4852a; border-radius: 6px; padding: 20px; text-align: left;">
                    <p style="margin: 0; font-size: 13px; color: #7a6340; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1.5px;">
                      Fulfillment Details
                    </p>
                    <p style="margin: 10px 0 6px; font-size: 15px; color: #2d2d2d; font-family: Arial, sans-serif;">
                      <strong>Carrier:</strong> ${carrier}
                    </p>
                    <p style="margin: 0 0 10px; font-size: 15px; color: #2d2d2d; font-family: Arial, sans-serif;">
                      <strong>Tracking Number:</strong> ${trackingNumber}
                    </p>
                    <p style="margin: 12px 0 0; font-size: 14px; font-family: Arial, sans-serif;">
                      <a href="https://www.delhivery.com/track/package/${trackingNumber}" target="_blank" style="display: inline-block; background-color: #c4852a; color: #ffffff; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: 600;">Track Shipment →</a>
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px; font-size: 14px; color: #1a3d2b; font-family: Arial, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Order Number: #${order.orderNumber}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1a3d2b; padding: 28px 40px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #a8c4b0; font-family: Arial, sans-serif; font-style: italic; letter-spacing: 1px;">
                Ancient Wisdom, Modern Wellness
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b9e7a; font-family: Arial, sans-serif;">
                🌿 Siddham Wellness &nbsp;|&nbsp; Reply to this email for support
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildOrderCancelledHtml(order: OrderEmailData, reason: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Order Has Been Cancelled – Siddham Wellness</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0e8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3d2b; padding: 36px 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <p style="margin: 0; font-size: 28px; color: #ffffff; font-family: Georgia, serif; font-weight: 700; letter-spacing: 1px;">
                🌿 Siddham Wellness
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #a8c4b0; font-family: Arial, sans-serif; letter-spacing: 2px; text-transform: uppercase;">
                Ancient Wisdom, Modern Wellness
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 32px;">
              <p style="margin: 0 0 8px; font-size: 22px; color: #991b1b; font-family: Georgia, serif; font-weight: 700;">
                Order Cancelled – #${order.orderNumber}
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #5a5a5a; font-family: Arial, sans-serif; line-height: 1.6;">
                Hello ${order.customerName}, your order has been cancelled. If any payment was captured, the refund will be initiated to your original payment method.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #fee2e2; border: 1.5px solid #991b1b; border-radius: 6px; padding: 20px; text-align: left;">
                    <p style="margin: 0; font-size: 13px; color: #991b1b; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                      Cancellation Details
                    </p>
                    <p style="margin: 10px 0 0; font-size: 15px; color: #2d2d2d; font-family: Arial, sans-serif; line-height: 1.5;">
                      ${reason || 'Not specified'}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px; font-size: 14px; color: #5a5a5a; font-family: Arial, sans-serif;">
                If you have any questions or believe this was done in error, please reply to this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1a3d2b; padding: 28px 40px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #a8c4b0; font-family: Arial, sans-serif; font-style: italic; letter-spacing: 1px;">
                Ancient Wisdom, Modern Wellness
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b9e7a; font-family: Arial, sans-serif;">
                🌿 Siddham Wellness &nbsp;|&nbsp; Reply to this email for support
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<void> {
  const result = await sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed – #${order.orderNumber} | Siddham Wellness`,
    html: buildOrderConfirmationHtml(order),
  });
  if (!result.success) {
    console.error('[email] Failed to send order confirmation email');
  }
}

export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  const result = await sendEmail({
    to: email,
    subject: 'Welcome to Siddham Wellness 🌿',
    html: buildWelcomeHtml(name),
  });
  if (!result.success) {
    console.error('[email] Failed to send welcome email');
  }
}

export async function sendOrderShippedEmail(order: OrderEmailData, carrier: string, trackingNumber: string): Promise<void> {
  const result = await sendEmail({
    to: order.customerEmail,
    subject: `Your Order #${order.orderNumber} Has Shipped! 🚚 | Siddham Wellness`,
    html: buildOrderShippedHtml(order, carrier, trackingNumber),
  });
  if (!result.success) {
    console.error('[email] Failed to send order shipped email');
  }
}

export async function sendOrderCancelledEmail(order: OrderEmailData, reason: string): Promise<void> {
  const result = await sendEmail({
    to: order.customerEmail,
    subject: `Order #${order.orderNumber} Cancelled | Siddham Wellness`,
    html: buildOrderCancelledHtml(order, reason),
  });
  if (!result.success) {
    console.error('[email] Failed to send order cancelled email');
  }
}
