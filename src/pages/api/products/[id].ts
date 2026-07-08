import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireEditorRole } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { getOrSet, del, delPattern } from "@/lib/cache";

const PRODUCT_CACHE_TTL = 60 * 10; // 10 minutes
const REVIEWS_LIMIT = 20; // cap reviews to avoid over-fetching

function productCacheKey(id: string) {
  return "product:" + id;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;
  const productId = id as string;

  if (req.method === "GET") {
    try {
      const product = await getOrSet(
        productCacheKey(productId),
        PRODUCT_CACHE_TTL,
        () =>
          prisma.product.findUnique({
            where: { id: productId },
            include: {
              category: true,
              variants: true,
              images: {
                select: {
                  id: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
              reviews: {
                orderBy: { createdAt: "desc" },
                take: REVIEWS_LIMIT,
              },
            },
          }),
      );

      if (!product) return res.status(404).json({ error: "Product not found" });

      res.setHeader(
        "Cache-Control",
        "public, s-maxage=120, stale-while-revalidate=600",
      );
      return res.status(200).json({ product });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch product" });
    }
  }

  if (req.method === "PUT") {
    try {
      requireEditorRole(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      caption,
      description,
      price,
      comparePrice,
      images,
      stock,
      sku,
      isActive,
      isFeatured,
      ingredients,
      benefits,
      usage,
      weight,
      videoUrl,
      videoUrls,
      categoryId,
      variants,
    } = req.body;

    try {
      const updateData: Record<string, unknown> = {
        description,
        isActive,
        isFeatured,
        ingredients,
        benefits,
        usage,
        weight,
        categoryId,
      };

      if (name) {
        updateData.name = name;
        updateData.slug = generateSlug(name);
      }
      if (videoUrls !== undefined) {
        const normalizedVideoUrls = Array.isArray(videoUrls)
          ? videoUrls.filter(Boolean)
          : [];
        updateData.videoUrls = normalizedVideoUrls;
        updateData.videoUrl = normalizedVideoUrls[0] || null;
      } else if (videoUrl !== undefined) {
        updateData.videoUrl = videoUrl || null;
        updateData.videoUrls = videoUrl ? [videoUrl] : [];
      }
      if (caption !== undefined) updateData.caption = caption || null;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (comparePrice !== undefined)
        updateData.comparePrice = comparePrice
          ? parseFloat(comparePrice)
          : null;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (sku !== undefined) updateData.sku = sku || null;

      if (variants !== undefined) {
        const existingVariants = await prisma.productVariant.findMany({
          where: { productId },
        });
        const existingIds = existingVariants.map((v) => v.id);
        const incomingIds = (variants as any[])
          .map((v) => v.id)
          .filter(Boolean);
        const idsToDelete = existingIds.filter(
          (id) => !incomingIds.includes(id),
        );

        if (idsToDelete.length > 0) {
          await prisma.productVariant.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        // Parallel upserts - fixes N+1 sequential loop bug
        await Promise.all(
          (variants as any[]).map((v) =>
            v.id
              ? prisma.productVariant.update({
                  where: { id: v.id },
                  data: {
                    name: v.name,
                    price: parseFloat(v.price),
                    comparePrice: v.comparePrice
                      ? parseFloat(v.comparePrice)
                      : null,
                    stock: parseInt(v.stock) || 0,
                    sku: v.sku || null,
                  },
                })
              : prisma.productVariant.create({
                  data: {
                    productId,
                    name: v.name,
                    price: parseFloat(v.price),
                    comparePrice: v.comparePrice
                      ? parseFloat(v.comparePrice)
                      : null,
                    stock: parseInt(v.stock) || 0,
                    sku: v.sku || null,
                  },
                }),
          ),
        );
      }

      if (images !== undefined && Array.isArray(images)) {
        const keptImageIds: string[] = [];
        const newImagesBase64: string[] = [];

        images.forEach((img: string) => {
          if (img.startsWith("/api/products/images/")) {
            const id = img.split("/").pop();
            if (id) keptImageIds.push(id);
          } else if (img.startsWith("data:")) {
            newImagesBase64.push(img);
          }
        });

        // 1. Delete removed images
        await prisma.productImage.deleteMany({
          where: {
            productId,
            id: { notIn: keptImageIds },
          },
        });

        // 2. Insert new base64 images
        if (newImagesBase64.length > 0) {
          await prisma.productImage.createMany({
            data: newImagesBase64.map((base64) => ({
              productId,
              base64,
            })),
          });
        }
      }

      const product = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: true,
          variants: true,
          images: {
            select: { id: true },
            orderBy: { createdAt: "asc" }
          }
        },
      });

      await Promise.all([
        del(productCacheKey(productId)),
        delPattern("products:list:"),
      ]);

      // Warm up search cache in the background
      const { warmUpSearchCache } = require("@/lib/cacheWarmup");
      warmUpSearchCache().catch((err: any) => console.error("[cache-warmup] Error warming up after product update/delete:", err));

      return res.status(200).json({ product });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      requireEditorRole(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const orderItemCount = await prisma.orderItem.count({
        where: { productId },
      });

      if (orderItemCount > 0) {
        await prisma.product.update({
          where: { id: productId },
          data: { isActive: false },
        });
      } else {
        await prisma.product.delete({ where: { id: productId } });
      }

      await Promise.all([
        del(productCacheKey(productId)),
        delPattern("products:list:"),
      ]);

      // Warm up search cache in the background
      const { warmUpSearchCache } = require("@/lib/cacheWarmup");
      warmUpSearchCache().catch((err: any) => console.error("[cache-warmup] Error warming up after product update/delete:", err));

      return res.status(200).json({
        success: true,
        message:
          orderItemCount > 0
            ? "Product soft-deleted (marked inactive) since it is referenced in orders."
            : "Product deleted.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
