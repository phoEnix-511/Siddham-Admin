import type { NextApiRequest, NextApiResponse } from "next";

/**
 * WhatsApp Cloud API Webhook
 *
 * GET  — Meta verification challenge (one-time setup handshake)
 * POST — Incoming message delivery status updates & inbound messages
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // ─── GET: Webhook Verification ────────────────────────────────
  // Meta sends a GET request with hub.mode, hub.verify_token, hub.challenge
  // to verify you own the endpoint. You must echo back the challenge.
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[whatsapp-webhook] Verification successful");
      return res.status(200).send(challenge);
    }

    console.warn("[whatsapp-webhook] Verification failed — token mismatch");
    return res.status(403).json({ error: "Forbidden" });
  }

  // ─── POST: Incoming Events ────────────────────────────────────
  // Meta sends delivery receipts (sent/delivered/read) and inbound messages.
  // We must always return 200 quickly — Meta retries on failure.
  if (req.method === "POST") {
    const body = req.body;

    try {
      // Log the webhook payload for debugging
      const entries = body?.entry || [];
      for (const entry of entries) {
        const changes = entry?.changes || [];
        for (const change of changes) {
          const value = change?.value;
          if (!value) continue;

          // Message status updates (sent → delivered → read)
          const statuses = value.statuses || [];
          for (const status of statuses) {
            console.log(
              `[whatsapp-webhook] Message ${status.id} to ${status.recipient_id}: ${status.status}`,
            );
          }

          // Inbound messages from customers (optional — for future use)
          const messages = value.messages || [];
          for (const msg of messages) {
            console.log(
              `[whatsapp-webhook] Inbound message from ${msg.from}: ${msg.type} — ${msg.text?.body || "(media)"}`,
            );
            // Future: auto-reply, support ticket creation, etc.
          }
        }
      }
    } catch (err) {
      console.error("[whatsapp-webhook] Error processing webhook:", err);
    }

    // Always return 200 — Meta will retry on non-2xx
    return res.status(200).json({ status: "ok" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
