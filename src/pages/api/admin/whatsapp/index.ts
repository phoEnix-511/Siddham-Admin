import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    requireAdminRole(req);
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { contactId } = req.query;

  try {
    if (contactId) {
      // Get conversation with specific contact
      const messages = await prisma.whatsAppMessage.findMany({
        where: {
          OR: [
            { from: String(contactId) },
            { to: String(contactId) }
          ]
        },
        orderBy: { timestamp: "asc" },
      });
      return res.status(200).json({ messages });
    } else {
      // Get all unique conversations (latest message per contact)
      // Since prisma doesn't support DISTINCT ON perfectly across both to/from fields easily, 
      // we fetch the latest inbound/outbound and group in memory.
      const rawMessages = await prisma.whatsAppMessage.findMany({
        orderBy: { timestamp: "desc" },
        take: 1000
      });

      const convos = new Map();
      for (const msg of rawMessages) {
        // The contact is 'from' if it's inbound, or 'to' if it's outbound.
        const contactId = msg.direction === 'INBOUND' ? msg.from : msg.to;
        if (!convos.has(contactId)) {
          convos.set(contactId, {
            contactId,
            contactName: msg.direction === 'INBOUND' ? msg.senderName : contactId,
            lastMessage: msg.body || [],
            lastMessageTime: msg.timestamp,
            direction: msg.direction,
            unread: 0
          });
        }
        // Count unread (basic approximation: any received message not marked read)
        if (msg.direction === 'INBOUND' && msg.status === 'received') {
           const c = convos.get(contactId);
           c.unread += 1;
        }
      }

      return res.status(200).json({ conversations: Array.from(convos.values()) });
    }
  } catch (error) {
    console.error("[whatsapp/index] API error", error);
    return res.status(500).json({ error: "Failed to fetch WhatsApp messages" });
  }
}
