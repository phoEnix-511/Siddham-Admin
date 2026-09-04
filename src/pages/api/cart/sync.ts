import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, items, customerId } = req.body;

  if (!sessionId || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid cart payload" });
  }

  try {
    if (items.length === 0) {
      // Clear cart
      await prisma.cartSnapshot.deleteMany({
        where: { sessionId },
      });
      return res.status(200).json({ success: true, action: "deleted" });
    }

    // Upsert cart
    await prisma.cartSnapshot.upsert({
      where: { sessionId },
      update: {
        items,
        customerId: customerId || null,
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        customerId: customerId || null,
        items,
      },
    });

    return res.status(200).json({ success: true, action: "upserted" });
  } catch (error) {
    console.error("[cart/sync] Sync error:", error);
    return res.status(500).json({ error: "Failed to sync cart" });
  }
}
