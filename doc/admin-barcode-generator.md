# Admin QR & barcode generator

## Routes

| Path | Purpose |
|------|---------|
| `/admin/prepaid/generate` | UI: batch generate, preview, CSV export |
| `POST /api/admin/prepaid/generate` | Create batch rows |
| `PUT /api/admin/prepaid/generate` | Decode GS1 template v1 |
| `PATCH /api/admin/prepaid/generate` | Preview single GS1 compose |
| `GET /api/admin/prepaid/qr-image?data=&width=` | QR PNG (`width` 120–640 px, default 280) |
| `GET /api/admin/prepaid/barcode-image?data=` | Code 128 PNG via Orca (`padding`, `fontsize`, `scale`) |

## Flow

1. **Generate** on admin page (test or GS1 mode).
2. **Download CSV** or copy for import.
3. **Import** at `/admin/prepaid` (same columns as before).
4. **Test** dealer scan at `/dealer` with barcode payload.

## GS1 template v1

`(01)` GTIN-14 + `(21)` serial + `(10)` lot + `(17)` expiry YYMMDD — concatenated without FNC1 for DB/POS lookup.

Confirm field order with client using a physical voucher + [Orca GS1 decoder](https://orcascan.com/tools/gs1-barcode-decoder).

## Preview image size

On `/admin/prepaid/generate`, after generating a batch, use **Image size (preview)** sliders:

- **QR width** — PNG pixel size (120–640).
- **Barcode scale** — Orca `scale` (1×–4×).
- **Barcode padding** / **Caption font** — quiet zone and label text.

Right-click preview images to save for print layout.

## Env

- `NEXT_PUBLIC_APP_URL` — used when “QR encodes full cart URL” is enabled.
