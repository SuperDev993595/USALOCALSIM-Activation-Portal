-- Per-market SIM hardware deduction (overrides fallback from audit / env when set)
CREATE TABLE `SimHardwareCostByMarket` (
    `market` VARCHAR(191) NOT NULL,
    `cents` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`market`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
