-- Rename workflow-oriented column names to domain-oriented names.

ALTER TABLE `Voucher` CHANGE COLUMN `phase1DeclaredPayCents` `declaredPayCents` INTEGER NULL;

ALTER TABLE `ShopPurchase`
  CHANGE COLUMN `phase2FulfillmentType` `redemptionFulfillmentType` VARCHAR(191) NULL,
  CHANGE COLUMN `phase2Iccid` `redemptionIccid` VARCHAR(191) NULL,
  CHANGE COLUMN `phase2ShippingAddress` `redemptionShippingAddress` TEXT NULL,
  CHANGE COLUMN `phase2ShippingCents` `redemptionShippingCents` INTEGER NOT NULL DEFAULT 0,
  CHANGE COLUMN `phase2CreditAppliedCents` `redemptionCreditAppliedCents` INTEGER NOT NULL DEFAULT 0,
  CHANGE COLUMN `phase2ExtraPaidCents` `redemptionExtraPaidCents` INTEGER NOT NULL DEFAULT 0,
  CHANGE COLUMN `phase2FinalTotalCents` `redemptionFinalTotalCents` INTEGER NOT NULL DEFAULT 0;
