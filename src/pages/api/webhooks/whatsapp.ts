import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * WhatsApp Cloud API Webhook
 *
 * GET  — Meta verification challenge (one-time setup handshake)
 * POST — Incoming message delivery status updates & inbound messages
 *
 * Security: POST requests are verified using X-Hub-Signature-256 header.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // ─── GET: Webhook Verification ────────────────────────────────
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (!verifyToken) {
      console.error("[whatsapp-webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[whatsapp-webhook] Verification successful");
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(String(challenge || ""));
    }

    console.warn(`[whatsapp-webhook] Verification failed — token mismatch`);
    return res.status(403).json({ error: "Forbidden" });
  }

  // ─── POST: Incoming Events ────────────────────────────────────
  if (req.method === "POST") {
    // Verify X-Hub-Signature-256 to prevent spoofed webhook calls
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (appSecret) {
      const signature = req.headers["x-hub-signature-256"] as string | undefined;
      if (!signature || !signature.startsWith("sha256=")) {
        console.warn("[whatsapp-webhook] Missing signature header");
        return res.status(403).json({ error: "Missing signature" });
      }
      const rawBody = JSON.stringify(req.body);
      const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody, "utf-8").digest("hex");
      try {
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
          console.warn("[whatsapp-webhook] Invalid signature — rejecting POST");
          return res.status(403).json({ error: "Invalid signature" });
        }
      } catch {
        return res.status(403).json({ error: "Signature verification failed" });
      }
    } else {
      console.warn("[whatsapp-webhook] WHATSAPP_APP_SECRET not set — skipping signature verification");
    }

    const body = req.body;

    try {
      const entries = body?.entry || [];
      for (const entry of entries) {
        const changes = entry?.changes || [];
        for (const change of changes) {
          const value = change?.value;
          if (!value) continue;

          // Message status updates (sent → delivered → read)
          const statuses = value.statuses || [];
          for (const status of statuses) {
            console.log(`[whatsapp-webhook] Message ${status.id} to ${status.recipient_id}: ${status.status}`);
            try {
              await (prisma as any).whatsAppMessage?.updateMany({
                where: { messageId: status.id },
                data: { status: status.status },
              });
            } catch { /* model not yet migrated */ }
          }

          // Inbound messages from customers
          const messages = value.messages || [];
          const contacts = value.contacts || [];
          for (const msg of messages) {
            const contact = contacts.find((c: any) => c.wa_id === msg.from);
            const senderName = contact?.profile?.name || msg.from;
            console.log(`[whatsapp-webhook] Inbound from ${msg.from} (${senderName}): ${msg.type} — ${msg.text?.body || "(media)"}`);
            // Persist inbound message for admin inbox
            try {
              await (prisma as any).whatsAppMessage?.create({
                data: {
                  messageId: msg.id,
                  from: msg.from,
                  senderName,
                  to: value.metadata?.phone_number_id || "",
                  type: msg.type,
                  body: msg.text?.body || null,
                  mediaUrl: msg.type === "image" ? msg.image?.id : null,
                  direction: "INBOUND",
                  status: "received",
                  timestamp: new Date(parseInt(msg.timestamp) * 1000),
                },
              });

              // Send Admin Push Notification
              import("@/lib/push").then(({ sendAdminPushNotification }) => {
                sendAdminPushNotification(
                  `New WhatsApp message from ${senderName}`,
                  msg.text?.body || "Sent an attachment",
                  "/admin/whatsapp"
                );
              }).catch(console.error);

              // Auto-reply logic
              import("@/lib/cache").then(async ({ getFlag, setFlag }) => {
                const autoReplyKey = `autoreply:${msg.from}`;
                const hasAutoReplied = await getFlag(autoReplyKey);
                if (!hasAutoReplied) {
                  const settingsRes = await (prisma as any).setting.findFirst({ where: { key: 'whatsapp_access_token' } });
                  const token = settingsRes?.value;
                  const phoneRes = await (prisma as any).setting.findFirst({ where: { key: 'whatsapp_phone_number_id' } });
                  const phoneId = phoneRes?.value;

                  if (token && phoneId) {
                    const replyText = "Thank you for reaching out to Siddham Wellness! We have received your query and someone will reach out to you soon. 🌿";
                    await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: msg.from,
                        type: "text",
                        text: { body: replyText },
                      }),
                    });
                    // Set 12 hour cooldown
                    await setFlag(autoReplyKey, 43200);
                  }
                }
              }).catch(console.error);

            } catch (err) {
              console.error("[whatsapp-webhook] Failed to save inbound message:", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("[whatsapp-webhook] Error processing webhook:", err);
    }

    return res.status(200).json({ status: "ok" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

