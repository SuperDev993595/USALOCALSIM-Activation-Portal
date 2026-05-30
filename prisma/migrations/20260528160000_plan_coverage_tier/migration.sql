ALTER TABLE `Plan` ADD COLUMN `coverageTier` VARCHAR(191) NULL;

CREATE INDEX `Plan_coverageTier_idx` ON `Plan`(`coverageTier`);

ALTER TABLE `ShopPurchase` ADD COLUMN `redemptionCoverageTier` VARCHAR(191) NULL;

CREATE INDEX `ShopPurchase_redemptionCoverageTier_idx` ON `ShopPurchase`(`redemptionCoverageTier`);
