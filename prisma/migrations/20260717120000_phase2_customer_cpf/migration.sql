-- Phase 2 identity (feedback 2026-07-17): optional CPF on purchase + voucher
ALTER TABLE `ShopPurchase` ADD COLUMN `customerCpf` VARCHAR(191) NULL;
ALTER TABLE `Voucher` ADD COLUMN `customerCpf` VARCHAR(191) NULL;
