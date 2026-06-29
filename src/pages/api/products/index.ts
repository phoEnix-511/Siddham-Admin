import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireEditorRole } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { getOrSet, delPattern } from "@/lib/cache";

const LIST_CACHE_TTL = 60 * 5; // 5 minutes

function buildListCacheKey(query: NextApiRequest["query"]): string {
  const { category, featured, search, page, limit, minPrice, maxPrice, sort } = query;
  const parts = [
    "cat=" + (category || ""),
    "feat=" + (featured || ""),
    "q=" + (search || ""),
    "p=" + (page || "1"),
    "l=" + (limit || "12"),
    "min=" + (minPrice || ""),
    "max=" + (maxPrice || ""),
    "sort=" + (sort || "newest"),
  ];
  return "products:list:" + parts.join("|");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      let isAdmin = false;
      try {
        requireEditorRole(req);
        isAdmin = true;
      } catch {
        // Not admin - public request
      }

      const {
        category,
        featured,
        search,
        page = "1",
        limit = "12",
        showInactive,
        minPrice,
        maxPrice,
        sort = "newest",
      } = req.query;
      const pageNum  = parseInt(page  as string);
      const limitNum = parseInt(limit as string);
      const skip     = (pageNum - 1) * limitNum;

      const where: Record<string, any> = {};
      if (!isAdmin || showInactive !== "true") {
        where.isActive = true;
      }
      if (minPrice || maxPrice) {
        const priceQuery: Record<string, number> = {};
        if (minPrice) priceQuery.gte = parseFloat(minPrice as string);
        if (maxPrice) priceQuery.lte = parseFloat(maxPrice as string);
        where.price = priceQuery;
      }
      if (category)            where.category   = { slug: category };
      if (featured === "true") where.isFeatured  = true;
      if (search) {
        where.OR = [
          { name:        { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } },
          { caption:     { contains: search as string, mode: "insensitive" } },
        ];
      }

      let orderBy: any = { createdAt: "desc" };
      if (sort === "price_asc") orderBy = { price: "asc" };
      else if (sort === "price_desc") orderBy = { price: "desc" };
      else if (sort === "name_asc") orderBy = { name: "asc" };
      else if (sort === "popular") orderBy = { orderItems: { _count: "desc" } };

      const fetchFresh = async () => {
        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            include: { category: true, variants: true },
            orderBy,
            skip,
            take: limitNum,
          }),
          prisma.product.count({ where }),
        ]);
        return {
          products,
          pagination: {
            page:  pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        };
      };

      const shouldCache = !isAdmin && showInactive !== "true";
      let data: Awaited<ReturnType<typeof fetchFresh>>;

      if (shouldCache) {
        const cacheKey = buildListCacheKey(req.query);
        data = await getOrSet(cacheKey, LIST_CACHE_TTL, fetchFresh);
        res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      } else {
        data = await fetchFresh();
        res.setHeader("Cache-Control", "no-store");
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  if (req.method === "POST") {
    try {
      requireEditorRole(req);
      const data = req.body;
      data.slug = data.slug || generateSlug(data.name);

      const product = await prisma.product.create({ data });

      // Invalidate all product list caches so new product shows up
      await delPattern("products:list:*");

      return res.status(201).json({ product });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}