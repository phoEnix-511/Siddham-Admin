-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT;
