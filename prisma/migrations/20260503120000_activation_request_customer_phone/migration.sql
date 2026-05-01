-- Service line MSISDN for provisioning (Phase 2 redeemer phone on cart_voucher flows; optional elsewhere).
ALTER TABLE `ActivationRequest` ADD COLUMN `customerPhoneE164` VARCHAR(191) NULL;
