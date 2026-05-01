-- Phase 1: cart session without SMS (phone/OTP only in Phase 2 after scratch PIN).
ALTER TABLE `ShopSession` MODIFY `phoneE164` VARCHAR(191) NULL;
ALTER TABLE `ShopSession` MODIFY `verifiedAt` DATETIME(3) NULL;
ALTER TABLE `CartPurchaseResumeToken` MODIFY `phoneE164` VARCHAR(191) NULL;
