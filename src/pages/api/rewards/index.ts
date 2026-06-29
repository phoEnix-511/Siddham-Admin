import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
      include: {
        rewardTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    return res.status(200).json({ 
      points: customer.points,
      transactions: customer.rewardTransactions 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch rewards" });
  }
}