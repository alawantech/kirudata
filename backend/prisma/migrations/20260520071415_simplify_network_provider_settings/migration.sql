/*
  Warnings:

  - You are about to drop the column `awoofId` on the `network_provider_settings` table. All the data in the column will be lost.
  - You are about to drop the column `corporateId` on the `network_provider_settings` table. All the data in the column will be lost.
  - You are about to drop the column `couponId` on the `network_provider_settings` table. All the data in the column will be lost.
  - You are about to drop the column `giftingId` on the `network_provider_settings` table. All the data in the column will be lost.
  - You are about to drop the column `sme2Id` on the `network_provider_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smeId` on the `network_provider_settings` table. All the data in the column will be lost.
  - You are about to drop the column `vtuId` on the `network_provider_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "network_provider_settings" DROP COLUMN "awoofId",
DROP COLUMN "corporateId",
DROP COLUMN "couponId",
DROP COLUMN "giftingId",
DROP COLUMN "sme2Id",
DROP COLUMN "smeId",
DROP COLUMN "vtuId",
ADD COLUMN     "extNetworkId" TEXT NOT NULL DEFAULT '';
