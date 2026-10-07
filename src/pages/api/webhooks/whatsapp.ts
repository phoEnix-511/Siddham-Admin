import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getFlag, setFlag } from "@/lib/cache";
import { sendAdminPushNotification } from "@/lib/push";

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
              // Capture media ID for any media type (image, video, audio, document, sticker)
              const mediaId =
                msg.image?.id || msg.video?.id || msg.audio?.id ||
                msg.document?.id || msg.sticker?.id || null;
              const mediaCaption =
                msg.image?.caption || msg.video?.caption || msg.document?.caption || null;
              const mediaFilename = msg.document?.filename || null;

              await (prisma as any).whatsAppMessage?.create({
                data: {
                  messageId: msg.id,
                  from: msg.from,
                  senderName,
                  to: value.metadata?.phone_number_id || "",
                  type: msg.type,
                  body: msg.text?.body || mediaCaption || mediaFilename || null,
                  mediaUrl: mediaId,
                  direction: "INBOUND",
                  status: "received",
                  timestamp: new Date(parseInt(msg.timestamp) * 1000),
                },
              });

              // Send Admin Push Notification
              try {
                const notifBody = msg.text?.body ||
                  (msg.type === 'image' ? '📷 Image' :
                   msg.type === 'video' ? '🎥 Video' :
                   msg.type === 'document' ? `📄 ${mediaFilename || 'Document'}` :
                   msg.type === 'audio' ? '🎵 Audio' : 'Sent an attachment');
                await sendAdminPushNotification(
                  `New WhatsApp message from ${senderName}`,
                  notifBody,
                  "/admin/whatsapp"
                );
              } catch (err) {
                console.error("[push] failed:", err);
              }

              // Push to Redis for Admin Notification bell icon & in-app alerts
              try {
                const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
                const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
                if (redisUrl && redisToken) {
                  const { Redis } = await import("@upstash/redis");
                  const redis = new Redis({ url: redisUrl, token: redisToken });
                  await redis.lpush("notifications:whatsapp", JSON.stringify({
                    type: "whatsapp",
                    id: msg.id,
                    senderName,
                    senderPhone: msg.from,
                    body: msg.text?.body || `[${msg.type}]`,
                    timestamp: Date.now()
                  }));
                  await redis.ltrim("notifications:whatsapp", 0, 99);
                }
              } catch (redisErr) {
                console.error("[whatsapp-webhook] Failed to push to Redis notifications:", redisErr);
              }

              // Auto-reply logic: strictly max 1 response per 12-hour window
              try {
                const autoReplyKey = `autoreply:${msg.from}`;
                let hasAutoReplied = await getFlag(autoReplyKey);

                // Fallback check: check database if an outbound message was sent in last 12 hours to this recipient
                if (!hasAutoReplied) {
                  try {
                    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
                    const recentOutbound = await (prisma as any).whatsAppMessage?.findFirst({
                      where: {
                        to: msg.from,
                        direction: "OUTBOUND",
                        timestamp: { gte: twelveHoursAgo },
                      },
                    });
                    if (recentOutbound) {
                      hasAutoReplied = true;
                      await setFlag(autoReplyKey, 43200); // re-sync Redis flag
                    }
                  } catch {
                    // ignore db check error, fallback to flag
                  }
                }

                if (!hasAutoReplied) {
                  // Acquire lock immediately so concurrent webhook events cannot race
                  await setFlag(autoReplyKey, 43200);

                  const settingsRes = await (prisma as any).setting.findFirst({ where: { key: 'whatsapp_access_token' } });
                  const token = settingsRes?.value;
                  const phoneRes = await (prisma as any).setting.findFirst({ where: { key: 'whatsapp_phone_number_id' } });
                  const phoneId = phoneRes?.value;

                  if (token && phoneId) {
                    const replyText = "Thank you for reaching out to Siddham Wellness! We have received your message and our team will get in touch with you within 24 hours. 🌿";
                    const fbRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
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

                    // Log outbound message to database so conversation thread and 12h window are tracked
                    try {
                      const fbData = await fbRes.json();
                      const sentMsgId = fbData?.messages?.[0]?.id || `auto_${Date.now()}`;
                      await (prisma as any).whatsAppMessage?.create({
                        data: {
                          messageId: sentMsgId,
                          from: phoneId,
                          to: msg.from,
                          type: "text",
                          body: replyText,
                          direction: "OUTBOUND",
                          status: "sent",
                          timestamp: new Date(),
                        },
                      });
                    } catch {}
                  }
                }
              } catch (err) {
                console.error("[auto-reply] failed:", err);
              }

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

