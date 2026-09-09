-- CreateTable
CREATE TABLE "data_providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'On',

    CONSTRAINT "data_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_data_plans" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "networkId" INTEGER NOT NULL,
    "networkCode" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "buyingPrice" TEXT NOT NULL,
    "userPrice" TEXT NOT NULL,
    "vendorPrice" TEXT NOT NULL,
    "validity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'On',

    CONSTRAINT "provider_data_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_providers_name_key" ON "data_providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "data_providers_slug_key" ON "data_providers"("slug");

-- AddForeignKey
ALTER TABLE "provider_data_plans" ADD CONSTRAINT "provider_data_plans_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "data_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_data_plans" ADD CONSTRAINT "provider_data_plans_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
