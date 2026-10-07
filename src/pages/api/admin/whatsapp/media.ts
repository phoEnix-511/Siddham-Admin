import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/whatsapp/media?mediaId=<whatsapp_media_id>
 *
 * Proxies WhatsApp media files through the server so the admin can view
 * images, documents, audio, and video sent by customers.
 * Meta's media URLs require Bearer auth - we cannot embed them directly.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    requireSuperAdmin(req);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { mediaId } = req.query;
  if (!mediaId || typeof mediaId !== "string") {
    return res.status(400).json({ error: "mediaId is required" });
  }

  try {
    // Get access token from settings
    const tokenRow = await prisma.setting.findFirst({ where: { key: "whatsapp_access_token" } });
    const accessToken = tokenRow?.value;
    if (!accessToken) {
      return res.status(503).json({ error: "WhatsApp access token not configured" });
    }

    // Step 1: Get the download URL for the media ID
    const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!metaRes.ok) {
      const err = await metaRes.text();
      console.error("[whatsapp/media] Meta API error:", err);
      return res.status(502).json({ error: "Failed to fetch media info from Meta" });
    }

    const metaData = await metaRes.json();
    const downloadUrl: string = metaData.url;
    const mimeType: string = metaData.mime_type || "application/octet-stream";

    if (!downloadUrl) {
      return res.status(404).json({ error: "Media URL not found" });
    }

    // Step 2: Download the actual media file
    const mediaRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mediaRes.ok) {
      return res.status(502).json({ error: "Failed to download media from Meta" });
    }

    // Step 3: Stream it to the client
    const buffer = Buffer.from(await mediaRes.arrayBuffer());

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    // For documents/PDFs, allow inline viewing in browser
    if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
      res.setHeader("Content-Disposition", "inline");
    } else {
      res.setHeader("Content-Disposition", `attachment`);
    }

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("[whatsapp/media] Error:", error);
    return res.status(500).json({ error: "Failed to proxy media" });
  }
}
