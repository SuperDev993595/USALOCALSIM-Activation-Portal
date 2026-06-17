# Scratch PIN formats (Global vs Three UK)

Physical cards use **two scratch code formats** on the inside panel. The portal detects the batch from the prefix (and from `voucherProductType` in the database).

## Defaults

| Card type | Scratch prefix | Example |
|-----------|----------------|---------|
| **Global** | `USL-G-` | `USL-G-K7H2M9P4` |
| **Three UK exclusive** | `USLTUK-` | `USLTUK-X8N2R5T7` |

Also accepted at redeem (Three UK): `3UK-`, `USL-3UK-` (see `VOUCHER_PREFIX_THREE_UK`).

## Generation

**Admin → Prepaid → Generate** — choose **Global** or **Three UK exclusive**; exported CSV `pin` column uses the matching prefix.

## Redeem

Customer enters the scratch PIN at `/redeem/enter`:

- `USL-G-…` → `/redeem` (four networks after SMS)
- `USLTUK-…` / `3UK-…` → `/redeem/three-uk` (no network picker)

## Printer / card artwork

- **Outside:** barcode/QR for POS activation (unchanged)
- **Inside:** scratch PIN with the correct prefix for that card stock
- Optional face text: **GLOBAL** vs **THREE UK** to match batch

## Env overrides

```env
VOUCHER_PREFIX_GLOBAL="USL-G-"
VOUCHER_PREFIX_THREE_UK="USLTUK-,3UK-,USL-3UK-"
```

## Demo cards (after `npx prisma db seed`)

| Type | Serial (POS) | Scratch PIN | Credit | Redeem path |
|------|--------------|-------------|--------|-------------|
| Global | `USALOCALGLO001` | `USL-G-DEMO0001` | $39 | `/redeem` |
| Three UK | `USALOCAL3UK001` | `USLTUK-DEMO0001` | $39 | `/redeem/three-uk` |
| Global (cart QR) | `USALOCALDEMO123` | `USL-G-DEMO0002` | $50 | `/cart?serial=…` or `/redeem` |

All demo cards are **POS-paid** and **eligible** — enter scratch PIN at `/redeem/enter` without dealer scan.
