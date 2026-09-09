-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "apiKey" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pin" INTEGER NOT NULL DEFAULT 1234,
    "pinDisabled" BOOLEAN NOT NULL DEFAULT false,
    "type" INTEGER NOT NULL DEFAULT 1,
    "wallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refWallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankNo" TEXT,
    "bankName" TEXT,
    "regStatus" INTEGER NOT NULL DEFAULT 2,
    "verCode" INTEGER NOT NULL DEFAULT 0,
    "kycStatus" TEXT,
    "dob" TEXT,
    "nin" TEXT,
    "bvn" TEXT,
    "referral" TEXT,
    "accountLimit" TEXT NOT NULL DEFAULT '100000',
    "regDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3),
    "accountReference" TEXT,
    "aspfiyBank" TEXT,
    "payvesselBank" TEXT,
    "palmpayBank" TEXT,
    "fidelityBankRef" TEXT,
    "sterlingBankRef" TEXT,
    "wemaBankRef" TEXT,
    "rolexBankRef" TEXT,
    "safehavenBank" TEXT,
    "banklyBank" TEXT,
    "psb9Bank" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "transref" TEXT NOT NULL,
    "servicename" TEXT NOT NULL,
    "servicedesc" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "oldbal" TEXT NOT NULL,
    "newbal" TEXT NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "apiResponse" TEXT,
    "apiResponseLog" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "networks" (
    "id" SERIAL NOT NULL,
    "networkCode" TEXT NOT NULL,
    "smeId" TEXT NOT NULL DEFAULT '',
    "sme2Id" TEXT NOT NULL DEFAULT '',
    "giftingId" TEXT NOT NULL DEFAULT '',
    "corporateId" TEXT NOT NULL DEFAULT '',
    "couponId" TEXT NOT NULL DEFAULT '',
    "awoofId" TEXT NOT NULL DEFAULT '',
    "vtuId" TEXT NOT NULL DEFAULT '',
    "sharesellId" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "networkStatus" TEXT NOT NULL DEFAULT 'Off',
    "vtuStatus" TEXT NOT NULL DEFAULT 'Off',
    "sharesellStatus" TEXT NOT NULL DEFAULT 'Off',
    "airtimepinStatus" TEXT NOT NULL DEFAULT 'Off',
    "smeStatus" TEXT NOT NULL DEFAULT 'Off',
    "sme2Status" TEXT NOT NULL DEFAULT 'Off',
    "giftingStatus" TEXT NOT NULL DEFAULT 'Off',
    "corporateStatus" TEXT NOT NULL DEFAULT 'Off',
    "datapinStatus" TEXT NOT NULL DEFAULT 'Off',
    "couponStatus" TEXT NOT NULL DEFAULT 'Off',
    "manualOrderStatus" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airtime_discounts" (
    "id" SERIAL NOT NULL,
    "networkId" INTEGER NOT NULL,
    "buyDiscount" DOUBLE PRECISION NOT NULL DEFAULT 96,
    "userDiscount" DOUBLE PRECISION NOT NULL,
    "agentDiscount" DOUBLE PRECISION NOT NULL,
    "vendorDiscount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "airtime_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airtime_pin_plans" (
    "id" SERIAL NOT NULL,
    "networkId" INTEGER NOT NULL,
    "planSize" TEXT NOT NULL,
    "buyingPrice" DOUBLE PRECISION NOT NULL,
    "userPrice" DOUBLE PRECISION NOT NULL,
    "agentPrice" DOUBLE PRECISION NOT NULL,
    "vendorPrice" DOUBLE PRECISION NOT NULL,
    "loadPin" TEXT,
    "checkBalance" TEXT,
    "planCode" INTEGER NOT NULL,

    CONSTRAINT "airtime_pin_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airtime_pin_prices" (
    "id" SERIAL NOT NULL,
    "networkId" INTEGER NOT NULL,
    "userDiscount" DOUBLE PRECISION NOT NULL,
    "agentDiscount" DOUBLE PRECISION NOT NULL,
    "vendorDiscount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "airtime_pin_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airtime_pin_stock" (
    "id" SERIAL NOT NULL,
    "networkId" INTEGER,
    "amount" DOUBLE PRECISION,
    "tokens" TEXT,
    "serial" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Unused',
    "soldTo" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "airtime_pin_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "buyingPrice" TEXT NOT NULL,
    "userPrice" TEXT NOT NULL,
    "agentPrice" TEXT NOT NULL,
    "vendorPrice" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "type" TEXT,
    "networkId" INTEGER NOT NULL,
    "validity" TEXT NOT NULL,

    CONSTRAINT "data_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_pins" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "buyingPrice" TEXT NOT NULL,
    "userPrice" TEXT NOT NULL,
    "agentPrice" TEXT NOT NULL,
    "vendorPrice" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "type" TEXT,
    "networkId" INTEGER NOT NULL,
    "validity" TEXT NOT NULL,

    CONSTRAINT "data_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "transRef" TEXT NOT NULL,
    "business" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "dataSize" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "serial" TEXT NOT NULL,
    "tokens" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPinId" INTEGER,

    CONSTRAINT "data_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recharge_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "transRef" TEXT NOT NULL,
    "business" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "dataSize" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "serial" TEXT NOT NULL,
    "tokens" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recharge_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cable_providers" (
    "id" SERIAL NOT NULL,
    "cableCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'On',

    CONSTRAINT "cable_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cable_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "buyingPrice" TEXT NOT NULL,
    "userPrice" TEXT NOT NULL,
    "agentPrice" TEXT NOT NULL,
    "vendorPrice" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "type" TEXT,
    "providerId" INTEGER NOT NULL,
    "validity" TEXT NOT NULL,

    CONSTRAINT "cable_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electricity_providers" (
    "id" SERIAL NOT NULL,
    "electricityCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'On',

    CONSTRAINT "electricity_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_providers" (
    "id" SERIAL NOT NULL,
    "examCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "buyingPrice" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'On',

    CONSTRAINT "exam_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alpha_topup_prices" (
    "id" SERIAL NOT NULL,
    "buyingPrice" INTEGER NOT NULL,
    "sellingPrice" INTEGER NOT NULL,
    "agentPrice" INTEGER NOT NULL,
    "vendorPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alpha_topup_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_configs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_links" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "type" TEXT,

    CONSTRAINT "api_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" SERIAL NOT NULL,
    "sitename" TEXT NOT NULL DEFAULT 'Guchor Data',
    "siteurl" TEXT NOT NULL DEFAULT 'https://yourdomain.com',
    "agentUpgradeFee" TEXT NOT NULL DEFAULT '500',
    "vendorUpgradeFee" TEXT NOT NULL DEFAULT '1000',
    "apiDocumentation" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "whatsappGroup" TEXT NOT NULL DEFAULT '',
    "facebook" TEXT NOT NULL DEFAULT '',
    "twitter" TEXT NOT NULL DEFAULT '',
    "instagram" TEXT NOT NULL DEFAULT '',
    "telegram" TEXT NOT NULL DEFAULT '',
    "referralUpgradeBonus" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "referralAirtimeBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "referralDataBonus" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "referralWalletBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referralCableBonus" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "referralExamBonus" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "referralMeterBonus" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "walletToWalletFee" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "siteColor" TEXT NOT NULL DEFAULT '#0bda0f',
    "loginDesign" TEXT NOT NULL DEFAULT '5',
    "homeDesign" TEXT NOT NULL DEFAULT '1',
    "notificationStatus" TEXT NOT NULL DEFAULT 'Off',
    "accountName" TEXT NOT NULL DEFAULT '',
    "accountNo" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT NOT NULL DEFAULT '',
    "electricityCharges" TEXT NOT NULL DEFAULT '0',
    "airtimeMin" TEXT NOT NULL DEFAULT '50',
    "airtimeMax" TEXT NOT NULL DEFAULT '50000',
    "kycOption" TEXT NOT NULL DEFAULT 'both',
    "kycBvnCharges" TEXT NOT NULL DEFAULT '10',
    "kycNinCharges" TEXT NOT NULL DEFAULT '70',
    "kycShouldVerify" TEXT NOT NULL DEFAULT 'yes',
    "kycShouldEnable" TEXT NOT NULL DEFAULT 'yes',
    "smileDiscount" TEXT NOT NULL DEFAULT '0',
    "airtimedaily" TEXT NOT NULL DEFAULT '5000',

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT,
    "phone" TEXT,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "msgFor" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "uploadPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "ref" TEXT,
    "query" TEXT,
    "userEmail" TEXT,
    "userRead" BOOLEAN NOT NULL DEFAULT false,
    "adminRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replies" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER,
    "replyBy" TEXT,
    "reply" TEXT,
    "img" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_funds" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "account" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monnify_accounts" (
    "id" SERIAL NOT NULL,
    "accountReference" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "monnify_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cac_requests" (
    "id" SERIAL NOT NULL,
    "certType" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "compName" TEXT NOT NULL,
    "altCompName" TEXT,
    "shareCap" DOUBLE PRECISION NOT NULL,
    "compAddr" TEXT NOT NULL,
    "resAddr" TEXT NOT NULL,
    "busNature" TEXT NOT NULL,
    "dirIdCard" TEXT,
    "passportPhoto" TEXT,
    "phoneNum" TEXT NOT NULL,
    "status" TEXT,
    "userId" INTEGER,
    "submitDate" TIMESTAMP(3),
    "note" TEXT NOT NULL DEFAULT 'Your CAC certificate will be ready in 3 to 14 days.',

    CONSTRAINT "cac_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_logins" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "user_logins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_visits" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "visitTime" TEXT NOT NULL,

    CONSTRAINT "user_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_apiKey_key" ON "users"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transref_key" ON "transactions"("transref");

-- CreateIndex
CREATE UNIQUE INDEX "api_configs_name_key" ON "api_configs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_phone_key" ON "blacklist"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airtime_discounts" ADD CONSTRAINT "airtime_discounts_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_plans" ADD CONSTRAINT "data_plans_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_pins" ADD CONSTRAINT "data_pins_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_tokens" ADD CONSTRAINT "data_tokens_dataPinId_fkey" FOREIGN KEY ("dataPinId") REFERENCES "data_pins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cable_plans" ADD CONSTRAINT "cable_plans_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "cable_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cac_requests" ADD CONSTRAINT "cac_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
