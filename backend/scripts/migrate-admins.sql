-- Safe migration: Redesign admins table without losing data
-- Run this SQL on the database directly

-- Step 1: Add new columns with temporary defaults
ALTER TABLE "admins" ADD COLUMN "email" TEXT;
ALTER TABLE "admins" ADD COLUMN "phone" TEXT;
ALTER TABLE "admins" ADD COLUMN "password" TEXT;
ALTER TABLE "admins" ADD COLUMN "role_new" TEXT DEFAULT 'admin';
ALTER TABLE "admins" ADD COLUMN "permissions" JSONB DEFAULT '[]';
ALTER TABLE "admins" ADD COLUMN "otpCode" TEXT;
ALTER TABLE "admins" ADD COLUMN "otpExpiresAt" TIMESTAMPTZ;
ALTER TABLE "admins" ADD COLUMN "otpAttempts" INTEGER DEFAULT 0;
ALTER TABLE "admins" ADD COLUMN "lastLoginAt" TIMESTAMPTZ;
ALTER TABLE "admins" ADD COLUMN "sessionTimeout" INTEGER DEFAULT 15;
ALTER TABLE "admins" ADD COLUMN "createdBy" INTEGER;
ALTER TABLE "admins" ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "admins" ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Migrate existing admin data (old username -> email, old token -> password)
-- The existing admin has username 'admin' and token is the bcrypt hash
UPDATE "admins" SET 
  "email" = 'admin@guchordata.com',
  "password" = "token",
  "role_new" = 'super_admin',
  "permissions" = '["admin_manage","dashboard_view","users_view","users_edit","users_credit","users_debit","users_reset_pin","users_reset_password","transactions_view","transactions_edit","notifications_manage","issues_manage","messages_manage","networks_manage","data_plans_manage","provider_data_plans_manage","data_card_plans_manage","recharge_card_plans_manage","cable_plans_manage","electricity_manage","exam_providers_manage","airtime_discounts_manage","airtime_to_cash_manage","api_configs_manage","api_links_manage","settings_manage","blacklist_manage","upgrade_requests_manage","kyc_manage"]'::jsonb,
  "status" = 1
WHERE "email" IS NULL;

-- Step 3: Drop old columns
ALTER TABLE "admins" DROP COLUMN "username";
ALTER TABLE "admins" DROP COLUMN "token";
ALTER TABLE "admins" DROP COLUMN "role";

-- Step 4: Rename role_new to role
ALTER TABLE "admins" RENAME COLUMN "role_new" TO "role";

-- Step 5: Make email and password NOT NULL now that data is migrated
ALTER TABLE "admins" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "admins" ALTER COLUMN "password" SET NOT NULL;

-- Step 6: Add unique constraint on email
ALTER TABLE "admins" ADD CONSTRAINT "admins_email_key" UNIQUE ("email");

-- Done! Now run: node scripts/create-admin.js
