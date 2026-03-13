/*
  Warnings:

  - You are about to drop the column `qtyMl` on the `Recipe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "actualRemainingG" INTEGER DEFAULT 0,
ADD COLUMN     "avgCostPerG" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "avgCostPerQty" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "latestCostPerG" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "latestCostPerQty" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "lowStockThresholdG" INTEGER DEFAULT 0,
ADD COLUMN     "theoreticalRemainingG" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "safetyStockG" INTEGER,
ADD COLUMN     "totalWeightG" INTEGER;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "weightG" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "weightG" INTEGER;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "qtyMl",
ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "unitType" TEXT;

-- AlterTable
ALTER TABLE "Stocktake" ADD COLUMN     "actualG" INTEGER,
ADD COLUMN     "countedRemainingG" INTEGER,
ADD COLUMN     "theoreticalG" INTEGER,
ADD COLUMN     "varianceG" INTEGER;
