-- Plan catalog SKU (separate from display name; feedback checklist item).
ALTER TABLE `Plan` ADD COLUMN `sku` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Plan_sku_planType_key` ON `Plan`(`sku`, `planType`);

CREATE INDEX `Plan_sku_idx` ON `Plan`(`sku`);
