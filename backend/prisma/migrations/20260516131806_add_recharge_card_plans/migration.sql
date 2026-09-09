-- CreateTable
CREATE TABLE "recharge_card_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "networkId" INTEGER NOT NULL,
    "networkName" TEXT NOT NULL,
    "planType" INTEGER NOT NULL,
    "cardName" TEXT NOT NULL,
    "buyingPrice" TEXT NOT NULL DEFAULT '0',
    "userPrice" TEXT NOT NULL,
    "vendorPrice" TEXT NOT NULL,
    "loadPin" TEXT,
    "checkBalance" TEXT,
    "status" TEXT NOT NULL DEFAULT 'On',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recharge_card_plans_pkey" PRIMARY KEY ("id")
);
