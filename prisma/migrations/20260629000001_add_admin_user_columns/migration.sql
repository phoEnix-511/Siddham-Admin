-- Migration: Add all missing columns/tables that were added to the Prisma schema
-- but never had corresponding migration files created.
-- Using IF NOT EXISTS / IF NOT IN to be safe against partial applies.

-- ── 1. AdminUser: add lastLogin + forcePasswordReset ───────────────────────
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Customer: add points, lastLogin, forcePasswordReset ────────────────
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "points" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false;

-- ── 3. OrderStatus enum: add OUT_FOR_DELIVERY if missing ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'OUT_FOR_DELIVERY'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')
  ) THEN
    ALTER TYPE "OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY' AFTER 'SHIPPED';
  END IF;
END$$;

-- ── 4. RewardTransaction table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "RewardTransaction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RewardTransaction_customerId_fkey'
  ) THEN
    ALTER TABLE "RewardTransaction"
      ADD CONSTRAINT "RewardTransaction_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- ── 5. BundleOffer table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BundleOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "minItems" INTEGER NOT NULL,
    "fixedPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BundleOffer_pkey" PRIMARY KEY ("id")
);
