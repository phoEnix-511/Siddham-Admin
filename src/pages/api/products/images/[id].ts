import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const imageId = id as string;

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Check if the data is a data URI
    const match = image.base64.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", buffer.length);
      // Cache-Control: Cache for up to 30 days (immutable)
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      return res.send(buffer);
    } else {
      // Fallback: If it's not a data URI, assume raw base64 JPEG
      const buffer = Buffer.from(image.base64, "base64");
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      return res.send(buffer);
    }
  } catch (error) {
    console.error("[api-image] Error fetching image:", error);
    return res.status(500).json({ error: "Failed to fetch image" });
  }
}
