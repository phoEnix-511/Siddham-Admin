import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, requireViewerRole } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET API is public (or requires Viewer role for Admin list)
  if (req.method === "GET") {
    try {
      const coupons = await prisma.couponOffer.findMany({
        orderBy: { minCartValue: "asc" }
      });
      return res.status(200).json({ coupons });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch coupon offers" });
    }
  }

  // POST: Create a new Coupon Offer
  if (req.method === "POST") {
    try {
      requireAdminRole(req);
      const { code, description, discountType, value, minCartValue, isActive } = req.body;
      
      if (!code || !discountType || value === undefined) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      const coupon = await prisma.couponOffer.create({
        data: {
          code: code.toUpperCase().trim(),
          description: description || "",
          discountType,
          value: parseFloat(value),
          minCartValue: minCartValue ? parseFloat(minCartValue) : 0,
          isActive: isActive !== false
        }
      });
      return res.status(201).json({ coupon });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: "Coupon code already exists" });
      }
      return res.status(500).json({ error: "Failed to create coupon offer" });
    }
  }

  // PUT: Update an existing Coupon Offer
  if (req.method === "PUT") {
    try {
      requireAdminRole(req);
      const { id, code, description, discountType, value, minCartValue, isActive } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "ID is required for updates" });
      }

      const coupon = await prisma.couponOffer.update({
        where: { id },
        data: {
          code: code ? code.toUpperCase().trim() : undefined,
          description,
          discountType,
          value: value !== undefined ? parseFloat(value) : undefined,
          minCartValue: minCartValue !== undefined ? parseFloat(minCartValue) : undefined,
          isActive: isActive !== undefined ? isActive : undefined
        }
      });
      return res.status(200).json({ coupon });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update coupon offer" });
    }
  }

  // DELETE: Remove a Coupon Offer
  if (req.method === "DELETE") {
    try {
      requireAdminRole(req);
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "ID is required for deletion" });
      }
      await prisma.couponOffer.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to delete coupon offer" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
