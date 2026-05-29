-- Global vs Three UK voucher types + carrier network catalog (feedback 2026-05-28).

CREATE TABLE `Network` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Network_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Network` (`id`, `slug`, `name`, `displayOrder`, `active`, `createdAt`) VALUES
    ('net_three_uk', 'three_uk', 'THREE UK', 1, true, CURRENT_TIMESTAMP(3)),
    ('net_linkup_att', 'linkup_att', 'LINKUP & AT&T MOBILE', 2, true, CURRENT_TIMESTAMP(3)),
    ('net_t_mobile', 't_mobile', 'T-MOBILE', 3, true, CURRENT_TIMESTAMP(3)),
    ('net_orange', 'orange', 'ORANGE', 4, true, CURRENT_TIMESTAMP(3));

ALTER TABLE `Plan` ADD COLUMN `networkId` VARCHAR(191) NULL;

CREATE INDEX `Plan_networkId_idx` ON `Plan`(`networkId`);

ALTER TABLE `Plan` ADD CONSTRAINT `Plan_networkId_fkey` FOREIGN KEY (`networkId`) REFERENCES `Network`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Voucher` ADD COLUMN `voucherProductType` VARCHAR(191) NOT NULL DEFAULT 'global';

CREATE INDEX `Voucher_voucherProductType_idx` ON `Voucher`(`voucherProductType`);
