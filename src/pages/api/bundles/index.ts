import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const bundles = await prisma.bundleOffer.findMany({
        orderBy: { minItems: "asc" }
      });
      return res.status(200).json({ bundles });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch bundles" });
    }
  }

  if (req.method === "POST") {
    try {
      requireAdmin(req);
      const { title, description, minItems, fixedPrice, isActive } = req.body;
      const bundle = await prisma.bundleOffer.create({
        data: { title, description, minItems: parseInt(minItems), fixedPrice: parseFloat(fixedPrice), isActive }
      });
      return res.status(201).json({ bundle });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create bundle" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}