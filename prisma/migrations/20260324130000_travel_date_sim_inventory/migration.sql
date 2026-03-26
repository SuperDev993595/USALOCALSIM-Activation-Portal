-- AlterTable: scheduling, partner SIM declaration, deduction amounts (client feedback)
ALTER TABLE `ActivationRequest` ADD COLUMN `travelDate` DATETIME(3) NULL,
    ADD COLUMN `hasPartnerSim` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hardwareDeductionCents` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `shippingDeductionCents` INTEGER NOT NULL DEFAULT 0;

-- Data migration: legacy queue lifecycle -> scheduled / active
UPDATE `ActivationRequest` SET `status` = 'scheduled' WHERE `status` = 'pending';
UPDATE `ActivationRequest` SET `status` = 'active' WHERE `status` = 'completed';
