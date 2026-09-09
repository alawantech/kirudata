/*
  Warnings:

  - You are about to drop the column `contact` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `contacts` table. All the data in the column will be lost.
  - Added the required column `email` to the `contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `contacts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "contact",
DROP COLUMN "subject",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "userId" SET DEFAULT 0;
