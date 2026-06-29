import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  const userId =
    session?.user && "id" in session.user ? session.user.id : undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { password } = req.body;
  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.customer.update({
      where: { id: userId },
      data: {
        hashedPassword: hashedPassword,
        forcePasswordReset: false,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[account/change-password] Error:", error);
    return res.status(500).json({ error: "Failed to update password" });
  }
}
