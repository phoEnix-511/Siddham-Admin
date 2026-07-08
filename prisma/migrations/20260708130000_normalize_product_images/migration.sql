-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "base64" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data from Product.images to ProductImage
INSERT INTO "ProductImage" ("id", "productId", "base64", "createdAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    val,
    NOW()
FROM "Product", unnest("images") as val
WHERE "images" IS NOT NULL AND array_length("images", 1) > 0;

-- DropColumn
ALTER TABLE "Product" DROP COLUMN "images";
