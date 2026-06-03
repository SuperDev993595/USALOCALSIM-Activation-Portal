-- DropIndex
DROP INDEX `Voucher_voucherProductType_idx` ON `Voucher`;

-- AlterTable
ALTER TABLE `IccidValidationConfig` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `SimHardwareCostByMarket` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_activatedById_fkey` FOREIGN KEY (`activatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivationRequest` ADD CONSTRAINT `ActivationRequest_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivationRequest` ADD CONSTRAINT `ActivationRequest_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
