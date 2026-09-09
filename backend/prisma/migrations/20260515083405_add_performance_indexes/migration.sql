-- CreateIndex
CREATE INDEX "transactions_userId_date_idx" ON "transactions"("userId", "date" DESC);

-- CreateIndex
CREATE INDEX "transactions_userId_servicedesc_date_idx" ON "transactions"("userId", "servicedesc", "date");

-- CreateIndex
CREATE INDEX "users_accountReference_idx" ON "users"("accountReference");
