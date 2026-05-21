-- Path B: retail barcode, market, face value; purchase payment source + idempotency ref.

ALTER TABLE `PrepaidCard`
    ADD COLUMN `barcodePayload` VARCHAR(191) NULL,
    ADD COLUMN `gtin` VARCHAR(191) NULL,
    ADD COLUMN `retailMarket` VARCHAR(191) NOT NULL DEFAULT 'us',
    ADD COLUMN `faceValueCents` INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX `PrepaidCard_barcodePayload_key` ON `PrepaidCard`(`barcodePayload`);
CREATE INDEX `PrepaidCard_retailMarket_idx` ON `PrepaidCard`(`retailMarket`);

ALTER TABLE `ShopPurchase`
    ADD COLUMN `paymentSource` VARCHAR(191) NOT NULL DEFAULT 'stripe',
    ADD COLUMN `externalPaymentRef` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `ShopPurchase_externalPaymentRef_key` ON `ShopPurchase`(`externalPaymentRef`);
