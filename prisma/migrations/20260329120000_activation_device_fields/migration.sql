-- AlterTable
ALTER TABLE `ActivationRequest` ADD COLUMN `deviceImei` VARCHAR(191) NULL,
    ADD COLUMN `deviceEid` VARCHAR(191) NULL,
    ADD COLUMN `physicalSimNumber` VARCHAR(191) NULL,
    ADD COLUMN `deviceDetailsImageDataUrl` LONGTEXT NULL;
