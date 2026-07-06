-- AlterTable
ALTER TABLE `ShopSession` ADD COLUMN `checkoutCustomerName` VARCHAR(191) NULL,
    ADD COLUMN `checkoutEmail` VARCHAR(191) NULL,
    ADD COLUMN `checkoutPreparedAt` DATETIME(3) NULL;
