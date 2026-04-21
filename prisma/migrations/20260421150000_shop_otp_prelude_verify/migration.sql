-- ShopPhoneOtp: drop local OTP storage (Prelude Verify owns the code); keep resend/attempt bookkeeping.
ALTER TABLE `ShopPhoneOtp` DROP COLUMN `codeHash`;
ALTER TABLE `ShopPhoneOtp` DROP COLUMN `expiresAt`;
ALTER TABLE `ShopPhoneOtp` CHANGE `createdAt` `lastSentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
