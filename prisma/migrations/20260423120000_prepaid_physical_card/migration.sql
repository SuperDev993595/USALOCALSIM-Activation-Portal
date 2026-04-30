-- CreateTable
CREATE TABLE `PrepaidCard` (
    `id` VARCHAR(191) NOT NULL,
    `serial` VARCHAR(191) NOT NULL,
    `voucherId` VARCHAR(191) NOT NULL,
    `basePlanId` VARCHAR(191) NOT NULL,
    `upgradePlanId` VARCHAR(191) NULL,
    `claimedCartSessionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PrepaidCard_serial_key`(`serial`),
    UNIQUE INDEX `PrepaidCard_voucherId_key`(`voucherId`),
    UNIQUE INDEX `PrepaidCard_claimedCartSessionId_key`(`claimedCartSessionId`),
    INDEX `PrepaidCard_basePlanId_fkey`(`basePlanId`),
    INDEX `PrepaidCard_upgradePlanId_fkey`(`upgradePlanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PrepaidCard` ADD CONSTRAINT `PrepaidCard_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrepaidCard` ADD CONSTRAINT `PrepaidCard_basePlanId_fkey` FOREIGN KEY (`basePlanId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrepaidCard` ADD CONSTRAINT `PrepaidCard_upgradePlanId_fkey` FOREIGN KEY (`upgradePlanId`) REFERENCES `Plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrepaidCard` ADD CONSTRAINT `PrepaidCard_claimedCartSessionId_fkey` FOREIGN KEY (`claimedCartSessionId`) REFERENCES `ShopSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `ShopPurchase` ADD COLUMN `prepaidCardId` VARCHAR(191) NULL,
    ADD COLUMN `redemptionAccessToken` VARCHAR(64) NULL,
    ADD COLUMN `redemptionAccessExpiresAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ShopPurchase_prepaidCardId_key` ON `ShopPurchase`(`prepaidCardId`);

-- CreateIndex
CREATE UNIQUE INDEX `ShopPurchase_redemptionAccessToken_key` ON `ShopPurchase`(`redemptionAccessToken`);

-- AddForeignKey
ALTER TABLE `ShopPurchase` ADD CONSTRAINT `ShopPurchase_prepaidCardId_fkey` FOREIGN KEY (`prepaidCardId`) REFERENCES `PrepaidCard`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
