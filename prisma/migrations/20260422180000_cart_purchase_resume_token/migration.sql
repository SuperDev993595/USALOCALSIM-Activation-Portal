-- CreateTable
CREATE TABLE `CartPurchaseResumeToken` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `cartPurchaseId` VARCHAR(191) NOT NULL,
    `phoneE164` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CartPurchaseResumeToken_token_key`(`token`),
    UNIQUE INDEX `CartPurchaseResumeToken_cartPurchaseId_key`(`cartPurchaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CartPurchaseResumeToken` ADD CONSTRAINT `CartPurchaseResumeToken_cartPurchaseId_fkey` FOREIGN KEY (`cartPurchaseId`) REFERENCES `ShopPurchase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
