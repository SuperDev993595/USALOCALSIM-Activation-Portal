# Scratch PIN formats (Global · Three UK · T-Mobile · Linkup)

Physical cards use **distinct scratch code formats** on the inside panel. The portal detects the batch from the prefix (and from `voucherProductType` in the database).

## Defaults

| Card type | Scratch prefix | Example | Redeem hub |
|-----------|----------------|---------|------------|
| **Global** | `USL-G-` | `USL-G-K7H2M9P4` | `/redeem` |
| **Three UK exclusive** | `USLTUK-` | `USLTUK-X8N2R5T7` | `/redeem/three-uk` |
| **T-Mobile exclusive** | `USLTM-` | `USLTM-X8N2R5T7` | `/redeem/t-mobile` |
| **LINKUP & AT&T exclusive** | `USLATT-` | `USLATT-X8N2R5T7` | `/redeem/linkup-att` |

Also accepted at redeem (Three UK): `3UK-`, `USL-3UK-` (see `VOUCHER_PREFIX_THREE_UK`).

Also accepted (T-Mobile): `USL-TM-` (see `VOUCHER_PREFIX_T_MOBILE`).

Also accepted (Linkup): `USLLU-`, `USL-LU-` (see `VOUCHER_PREFIX_LINKUP_ATT`).

## Generation

**Admin → Prepaid → Generate** — choose batch type; exported CSV `pin` column uses the matching prefix.

## Redeem

Customer enters the scratch PIN at `/redeem/enter`:

- `USL-G-…` → `/redeem` (tier + network after SMS)
- `USLTUK-…` / `3UK-…` → `/redeem/three-uk`
- `USLTM-…` → `/redeem/t-mobile` (T-Mobile plans only)
- `USLATT-…` / `USLLU-…` → `/redeem/linkup-att` (12GB / 30GB / 50GB, upgrade at redeem)

## Printer / card artwork

- **Outside:** barcode/QR for POS activation (unchanged)
- **Inside:** scratch PIN with the correct prefix for that card stock
- Optional face text: **GLOBAL**, **THREE UK**, **T-MOBILE**, or **LINKUP & AT&T** to match batch

## Env overrides

```env
VOUCHER_PREFIX_GLOBAL="USL-G-"
VOUCHER_PREFIX_THREE_UK="USLTUK-,3UK-,USL-3UK-"
VOUCHER_PREFIX_T_MOBILE="USLTM-,USL-TM-"
VOUCHER_PREFIX_LINKUP_ATT="USLATT-,USLLU-,USL-LU-"
```

## Demo cards (after `npx prisma db seed`)

| Type | Serial (POS) | Scratch PIN | Credit | Redeem path |
|------|--------------|-------------|--------|-------------|
| Global | `USALOCALGLO001` | `USL-G-DEMO0001` | $39 | `/redeem` |
| Three UK | `USALOCAL3UK001` | `USLTUK-DEMO0001` | $39 | `/redeem/three-uk` |
| T-Mobile | `USALOCALTM001` | `USLTM-DEMO0001` | $39 | `/redeem/t-mobile` |
| Linkup & AT&T | `USALOCALATT001` | `USLATT-DEMO0001` | $30 | `/redeem/linkup-att` |
| Global (dealer POS) | `USALOCALDEMO123` | `USL-G-DEMO0002` | $50 | `/redeem/enter` (POS-paid) |

POS-paid redeem cards: enter scratch PIN at `/redeem/enter` without dealer scan.

### Cart checkout (D2C)

| State | Serial (QR) | Scratch PIN | Face value | Test flow |
|-------|-------------|-------------|------------|-----------|
| Unpaid | `USALOCARTCHK01` | `USL-G-CART0001` | $50 | `/cart?serial=USALOCARTCHK01` → plans → Stripe test checkout |
| Unpaid (Linkup $30) | `USALOCARTATT01` | `USLATT-CART0001` | $30 | `/cart?serial=USALOCARTATT01` → credit checkout → Stripe |
| Paid (simulated Stripe) | `USALOCARTPAID01` | `USL-G-CART0002` | $50 | `/cart?serial=USALOCARTPAID01` → redeem |

Override unpaid serial with `CART_DEMO_SERIAL` when seeding.
