-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentRawResponse" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentReference_key" ON "Order"("paymentReference");
