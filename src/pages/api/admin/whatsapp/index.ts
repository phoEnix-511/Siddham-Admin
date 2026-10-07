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
      // Find latest message/contact details to preserve contact info before deleting messages
      const lastMsg = await prisma.whatsAppMessage.findFirst({
        where: {
          OR: [{ from: contactId }, { to: contactId }]
        },
        orderBy: { timestamp: "desc" }
      });

      const contactName = lastMsg?.direction === "INBOUND" ? lastMsg.senderName : null;

      // Upsert contact in WhatsAppContact table so it is permanently preserved
      await prisma.whatsAppContact.upsert({
        where: { phone: contactId },
        update: {
          ...(contactName ? { name: contactName } : {}),
        },
        create: {
          phone: contactId,
          name: contactName || null,
        },
      });

      // Delete message records for this contact
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
      const [messages, savedContacts] = await Promise.all([
        prisma.whatsAppMessage.findMany({
          select: {
            from: true,
            to: true,
            senderName: true,
            direction: true,
            timestamp: true,
          },
          orderBy: { timestamp: "desc" },
        }),
        prisma.whatsAppContact.findMany({
          orderBy: { updatedAt: "desc" }
        })
      ]);

      const contactMap = new Map<string, { phone: string; name: string; lastActivity: Date; messageCount: number }>();

      // First add saved contacts
      for (const sc of savedContacts) {
        contactMap.set(sc.phone, {
          phone: sc.phone,
          name: sc.name || sc.phone,
          lastActivity: sc.updatedAt,
          messageCount: 0,
        });
      }

      // Then merge active messages
      for (const m of messages) {
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
          if (new Date(m.timestamp) > new Date(item.lastActivity)) {
            item.lastActivity = m.timestamp;
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
      // Get all unique conversations & merge preserved contacts
      const [rawMessages, savedContacts] = await Promise.all([
        prisma.whatsAppMessage.findMany({
          orderBy: { timestamp: "desc" },
          take: 1000
        }),
        prisma.whatsAppContact.findMany({
          orderBy: { updatedAt: "desc" }
        })
      ]);

      const convos = new Map();

      // Seed with preserved contacts (e.g. from deleted chats or saved list)
      for (const sc of savedContacts) {
        convos.set(sc.phone, {
          contactId: sc.phone,
          contactName: sc.name || sc.phone,
          lastMessage: "(Chat cleared)",
          lastMessageTime: sc.updatedAt,
          direction: "OUTBOUND",
          unread: 0,
        });
      }

      // Layer on recent messages
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
        } else {
          // If already seeded from saved contacts, update with latest active message
          const existing = convos.get(contactId);
          if (new Date(msg.timestamp) >= new Date(existing.lastMessageTime) || existing.lastMessage === "(Chat cleared)") {
            existing.lastMessage = msg.body || `[${msg.type}]`;
            existing.lastMessageTime = msg.timestamp;
            existing.direction = msg.direction;
            if (msg.direction === 'INBOUND' && msg.senderName) {
              existing.contactName = msg.senderName;
            }
          }
        }
        if (msg.direction === 'INBOUND' && msg.status === 'received') {
           const c = convos.get(contactId);
           if (c) c.unread += 1;
        }
      }

      const sortedConvos = Array.from(convos.values()).sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      return res.status(200).json({ conversations: sortedConvos });
    }
  } catch (error) {
    console.error("[whatsapp/index] API error", error);
    return res.status(500).json({ error: "Failed to fetch WhatsApp messages" });
  }
}
