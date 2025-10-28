-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "content" TEXT;

-- CreateIndex
CREATE INDEX "Asset_type_idx" ON "Asset"("type");
