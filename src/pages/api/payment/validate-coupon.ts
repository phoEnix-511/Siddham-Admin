import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, cartValue } = req.body;
    if (!code || cartValue === undefined) {
      return res.status(400).json({ error: "Code and cartValue are required" });
    }

    const coupon = await prisma.couponOffer.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ error: "Coupon code not valid or expired" });
    }

    if (cartValue < coupon.minCartValue) {
      return res.status(400).json({ error: `Coupon requires a minimum cart value of ₹${coupon.minCartValue}` });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (cartValue * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    // Discount cannot exceed cart value
    discountAmount = Math.min(discountAmount, cartValue);

    return res.status(200).json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      discountAmount
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to validate coupon" });
  }
}
