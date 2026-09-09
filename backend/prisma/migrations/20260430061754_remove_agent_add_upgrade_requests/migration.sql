/*
  Warnings:

  - You are about to drop the column `agentDiscount` on the `airtime_discounts` table. All the data in the column will be lost.
  - You are about to drop the column `agentPrice` on the `airtime_pin_plans` table. All the data in the column will be lost.
  - You are about to drop the column `agentDiscount` on the `airtime_pin_prices` table. All the data in the column will be lost.
  - You are about to drop the column `agentPrice` on the `alpha_topup_prices` table. All the data in the column will be lost.
  - You are about to drop the column `agentPrice` on the `cable_plans` table. All the data in the column will be lost.
  - You are about to drop the column `agentPrice` on the `data_pins` table. All the data in the column will be lost.
  - You are about to drop the column `agentPrice` on the `data_plans` table. All the data in the column will be lost.
  - You are about to drop the column `agentUpgradeFee` on the `site_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "airtime_discounts" DROP COLUMN "agentDiscount";

-- AlterTable
ALTER TABLE "airtime_pin_plans" DROP COLUMN "agentPrice";

-- AlterTable
ALTER TABLE "airtime_pin_prices" DROP COLUMN "agentDiscount";

-- AlterTable
ALTER TABLE "alpha_topup_prices" DROP COLUMN "agentPrice";

-- AlterTable
ALTER TABLE "cable_plans" DROP COLUMN "agentPrice";

-- AlterTable
ALTER TABLE "data_pins" DROP COLUMN "agentPrice";

-- AlterTable
ALTER TABLE "data_plans" DROP COLUMN "agentPrice";

-- AlterTable
ALTER TABLE "site_settings" DROP COLUMN "agentUpgradeFee";

-- CreateTable
CREATE TABLE "upgrade_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upgrade_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
