-- CreateTable
CREATE TABLE "manual_fundings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "senderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3),
    "receiptUrl" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_fundings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manual_fundings_userId_status_idx" ON "manual_fundings"("userId", "status");

-- AddForeignKey
ALTER TABLE "manual_fundings" ADD CONSTRAINT "manual_fundings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

