-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "faviconUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "logoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sitetitle" TEXT NOT NULL DEFAULT '';
