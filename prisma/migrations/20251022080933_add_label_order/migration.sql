-- AlterTable
ALTER TABLE "Label" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Label_projectId_order_idx" ON "Label"("projectId", "order");
