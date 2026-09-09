-- CreateTable
CREATE TABLE "api_providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL DEFAULT '',
    "apiKey" TEXT NOT NULL DEFAULT '',
    "apiSecret" TEXT NOT NULL DEFAULT '',
    "authType" TEXT NOT NULL DEFAULT 'token',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_services" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "networkCode" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_plan_codes" (
    "id" SERIAL NOT NULL,
    "providerServiceId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "providerCode" TEXT NOT NULL,
    "buyingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "provider_plan_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_services_providerId_serviceKey_key" ON "provider_services"("providerId", "serviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "provider_plan_codes_providerServiceId_planId_key" ON "provider_plan_codes"("providerServiceId", "planId");

-- AddForeignKey
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "api_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_plan_codes" ADD CONSTRAINT "provider_plan_codes_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES "provider_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
