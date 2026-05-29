ALTER TABLE `ShopPurchase` ADD COLUMN `redemptionNetworkSlug` VARCHAR(191) NULL;

CREATE INDEX `ShopPurchase_redemptionNetworkSlug_idx` ON `ShopPurchase`(`redemptionNetworkSlug`);
