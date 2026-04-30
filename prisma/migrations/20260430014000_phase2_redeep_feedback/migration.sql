-- AlterTable
ALTER TABLE `Voucher`
    ADD COLUMN `pinCodeHash` VARCHAR(191) NULL,
    ADD COLUMN `creditAmountCents` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `customerEmail` VARCHAR(191) NULL,
    ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paymentStatus` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `linkedIccid` VARCHAR(191) NULL,
    ADD COLUMN `fulfillmentType` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ShopPurchase`
    ADD COLUMN `phase2FulfillmentType` VARCHAR(191) NULL,
    ADD COLUMN `phase2Iccid` VARCHAR(191) NULL,
    ADD COLUMN `phase2ShippingAddress` TEXT NULL,
    ADD COLUMN `phase2ShippingCents` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `phase2CreditAppliedCents` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `phase2ExtraPaidCents` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `phase2FinalTotalCents` INTEGER NOT NULL DEFAULT 0;
