-- AlterTable
ALTER TABLE "users" ALTER COLUMN "pin" SET DEFAULT '',
ALTER COLUMN "pin" SET DATA TYPE TEXT USING '';

-- Reset all existing PINs to empty string and disable PIN check for existing users
-- (users must set a new PIN via the app; existing test/dev data is cleared)
UPDATE "users" SET "pin" = '', "pinDisabled" = TRUE;
