-- AlterTable
ALTER TABLE `Voucher`
    ADD COLUMN `pinLast4` VARCHAR(8) NULL,
    ADD COLUMN `customerName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ShopPurchase`
    ADD COLUMN `customerName` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Voucher_pinLast4_idx` ON `Voucher`(`pinLast4`);
