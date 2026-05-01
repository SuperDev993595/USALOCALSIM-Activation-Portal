-- Phase 2 redeemer phone (feedback-2026-05-01): verified independently of Phase 1 cart session.
ALTER TABLE `ShopPurchase` ADD COLUMN `redemptionPhoneE164` VARCHAR(191) NULL,
ADD COLUMN `redemptionPhoneVerifiedAt` DATETIME(3) NULL;
