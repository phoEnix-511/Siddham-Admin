import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { getOrSet, del } from "@/lib/cache";
import { CONCERN_CATEGORIES } from "@/lib/concerns";

const CACHE_KEY = "categories:all";
const CACHE_TTL = 60 * 60 * 24; // 24 hours - categories rarely change

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      const categories = await getOrSet(CACHE_KEY, CACHE_TTL, async () => {
        const existingCategories = await prisma.category.findMany({
          include: {
            _count: {
              select: {
                products: { where: { isActive: true } },
              },
            },
          },
          orderBy: { name: "asc" },
        });

        const mappedCategories = existingCategories.map((category) => ({
          ...category,
          isConcern: CONCERN_CATEGORIES.some(
            (concern) => concern.slug === category.slug,
          ),
        }));

        const concernSlugs = new Set(
          mappedCategories.map((category) => category.slug),
        );
        const missingConcerns = CONCERN_CATEGORIES.filter(
          (concern) => !concernSlugs.has(concern.slug),
        );

        for (const concern of missingConcerns) {
          const created = await prisma.category.create({
            data: {
              name: concern.name,
              slug: concern.slug,
              description: concern.description || null,
              imageUrl: concern.imageUrl || null,
            },
          });
          mappedCategories.push({
            ...created,
            _count: { products: 0 },
            isConcern: true,
          });
        }

        return mappedCategories.sort((a, b) => a.name.localeCompare(b.name));
      });

      res.setHeader(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=86400",
      );
      return res.status(200).json({ categories });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  if (req.method === "POST") {
    try {
      requireAdminRole(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, description, imageUrl } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
      const slug = generateSlug(name);
      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description: description || null,
          imageUrl: imageUrl || null,
        },
      });

      await del(CACHE_KEY);

      return res.status(201).json({ category });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create category" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
