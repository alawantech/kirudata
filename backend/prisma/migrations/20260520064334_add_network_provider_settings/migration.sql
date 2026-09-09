-- CreateTable
CREATE TABLE "network_provider_settings" (
    "id" SERIAL NOT NULL,
    "networkId" INTEGER NOT NULL,
    "providerSlug" TEXT NOT NULL,
    "smeId" TEXT NOT NULL DEFAULT '',
    "sme2Id" TEXT NOT NULL DEFAULT '',
    "giftingId" TEXT NOT NULL DEFAULT '',
    "corporateId" TEXT NOT NULL DEFAULT '',
    "couponId" TEXT NOT NULL DEFAULT '',
    "awoofId" TEXT NOT NULL DEFAULT '',
    "vtuId" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "network_provider_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "network_provider_settings_networkId_providerSlug_key" ON "network_provider_settings"("networkId", "providerSlug");

-- AddForeignKey
ALTER TABLE "network_provider_settings" ADD CONSTRAINT "network_provider_settings_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
