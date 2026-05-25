# Admin QR & barcode generator

## Routes

| Path | Purpose |
|------|---------|
| `/admin/prepaid/generate` | UI: batch generate, preview, CSV export |
| `POST /api/admin/prepaid/generate` | Create batch rows |
| `PUT /api/admin/prepaid/generate` | Decode GS1 template v1 |
| `PATCH /api/admin/prepaid/generate` | Preview single GS1 compose |
| `GET /api/admin/prepaid/qr-image?data=` | QR PNG (qrcode lib) |
| `GET /api/admin/prepaid/barcode-image?data=` | Code 128 PNG via Orca proxy |

## Flow

1. **Generate** on admin page (test or GS1 mode).
2. **Download CSV** or copy for import.
3. **Import** at `/admin/prepaid` (same columns as before).
4. **Test** dealer scan at `/dealer` with barcode payload.

## GS1 template v1

`(01)` GTIN-14 + `(21)` serial + `(10)` lot + `(17)` expiry YYMMDD — concatenated without FNC1 for DB/POS lookup.

Confirm field order with client using a physical voucher + [Orca GS1 decoder](https://orcascan.com/tools/gs1-barcode-decoder).

## Env

- `NEXT_PUBLIC_APP_URL` — used when “QR encodes full cart URL” is enabled.
