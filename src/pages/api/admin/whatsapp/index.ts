import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireSuperAdmin(req);
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // DELETE: Delete chat history for a specific contact while keeping contact alive
  if (req.method === "DELETE") {
    const { contactId } = req.query;
    if (!contactId || typeof contactId !== "string") {
      return res.status(400).json({ error: "contactId is required" });
    }
    try {
      await prisma.whatsAppMessage.deleteMany({
        where: {
          OR: [
            { from: contactId },
            { to: contactId }
          ]
        }
      });
      return res.status(200).json({ success: true, message: "Chat history cleared" });
    } catch (err) {
      console.error("[whatsapp/delete] Error:", err);
      return res.status(500).json({ error: "Failed to delete chat history" });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contactId, exportContacts } = req.query;

  // EXPORT: Return all unique customer contact numbers & details for marketing export
  if (exportContacts === "true") {
    try {
      const messages = await prisma.whatsAppMessage.findMany({
        select: {
          from: true,
          to: true,
          senderName: true,
          direction: true,
          timestamp: true,
        },
        orderBy: { timestamp: "desc" },
      });

      const contactMap = new Map<string, { phone: string; name: string; lastActivity: Date; messageCount: number }>();

      for (const m of messages) {
        // Contact is 'from' if inbound, or 'to' if outbound
        const rawPhone = m.direction === "INBOUND" ? m.from : m.to;
        if (!rawPhone || rawPhone === "admin") continue;

        if (!contactMap.has(rawPhone)) {
          contactMap.set(rawPhone, {
            phone: rawPhone,
            name: (m.direction === "INBOUND" && m.senderName) ? m.senderName : rawPhone,
            lastActivity: m.timestamp,
            messageCount: 1,
          });
        } else {
          const item = contactMap.get(rawPhone)!;
          item.messageCount += 1;
          if (m.direction === "INBOUND" && m.senderName && item.name === rawPhone) {
            item.name = m.senderName;
          }
        }
      }

      const contacts = Array.from(contactMap.values()).sort(
        (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

      return res.status(200).json({ contacts });
    } catch (err) {
      console.error("[whatsapp/export] Error:", err);
      return res.status(500).json({ error: "Failed to export contacts" });
    }
  }

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
      const rawMessages = await prisma.whatsAppMessage.findMany({
        orderBy: { timestamp: "desc" },
        take: 1000
      });

      const convos = new Map();
      for (const msg of rawMessages) {
        const contactId = msg.direction === 'INBOUND' ? msg.from : msg.to;
        if (!contactId || contactId === 'admin') continue;

        if (!convos.has(contactId)) {
          convos.set(contactId, {
            contactId,
            contactName: msg.direction === 'INBOUND' ? (msg.senderName || contactId) : contactId,
            lastMessage: msg.body || `[${msg.type}]`,
            lastMessageTime: msg.timestamp,
            direction: msg.direction,
            unread: 0
          });
        }
        if (msg.direction === 'INBOUND' && msg.status === 'received') {
           const c = convos.get(contactId);
           if (c) c.unread += 1;
        }
      }

      return res.status(200).json({ conversations: Array.from(convos.values()) });
    }
  } catch (error) {
    console.error("[whatsapp/index] API error", error);
    return res.status(500).json({ error: "Failed to fetch WhatsApp messages" });
  }
}
