-- CreateTable
CREATE TABLE `ShopSession` (
    `id` VARCHAR(191) NOT NULL,
    `phoneE164` VARCHAR(191) NOT NULL,
    `verifiedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ShopSession_phoneE164_idx`(`phoneE164`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShopPhoneOtp` (
    `id` VARCHAR(191) NOT NULL,
    `phoneE164` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ShopPhoneOtp_phoneE164_key`(`phoneE164`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShopPurchase` (
    `id` VARCHAR(191) NOT NULL,
    `shopSessionId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `stripePaymentId` VARCHAR(191) NOT NULL,
    `amountPaidCents` INTEGER NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `voucherId` VARCHAR(191) NULL,
    `serviceStartDate` DATETIME(3) NULL,
    `redeemedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ShopPurchase_stripePaymentId_key`(`stripePaymentId`),
    UNIQUE INDEX `ShopPurchase_voucherId_key`(`voucherId`),
    INDEX `ShopPurchase_shopSessionId_idx`(`shopSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ShopPurchase` ADD CONSTRAINT `ShopPurchase_shopSessionId_fkey` FOREIGN KEY (`shopSessionId`) REFERENCES `ShopSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShopPurchase` ADD CONSTRAINT `ShopPurchase_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShopPurchase` ADD CONSTRAINT `ShopPurchase_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
