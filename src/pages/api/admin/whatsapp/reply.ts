import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { generateOrderNumber } from "@/lib/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let admin;
  try {
    admin = requireAdminRole(req);
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { to, text } = req.body;
  if (!to || !text) {
    return res.status(400).json({ error: "Missing 'to' or 'text' fields" });
  }

  try {
    const result = await sendWhatsAppText({ to, text });

    if (result.success) {
      // Persist the outbound message
      const msgId = result.data?.messages?.[0]?.id || "outbound-" + Date.now() + "-" + Math.random().toString(36).substring(2);
      
      await prisma.whatsAppMessage.create({
        data: {
          messageId: msgId,
          from: "admin", // The system phone number logically
          to: to,
          senderName: admin.name,
          type: "text",
          body: text,
          direction: "OUTBOUND",
          status: "sent",
          timestamp: new Date()
        }
      });
      return res.status(200).json({ success: true, messageId: msgId });
    } else {
      return res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error("[whatsapp/reply] error", error);
    return res.status(500).json({ error: "Failed to send reply" });
  }
}
