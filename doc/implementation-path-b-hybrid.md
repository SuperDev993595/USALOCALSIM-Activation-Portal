# Path B — Hybrid Prepaid Implementation (POS + D2C `/cart`)

Client spec: [`feedback/feedback-2026-05-21.md`](feedback/feedback-2026-05-21.md)

**Path B** keeps consumer Phase 1 checkout **and** adds retailer POS activation. Both paths produce the same `CartPurchase` + wallet credit; everyone redeems via `/redeem` (PIN → SMS → plans).

---

## Journeys

| Channel | Entry | When unpaid | When paid |
|---------|-------|-------------|-----------|
| **POS** | Barcode / QR scan at register | — | `POST /api/pos/activate` → wallet loaded |
| **D2C** | QR `/cart?serial=…` | `/cart/plans` → Stripe / Mercado Pago | Skip checkout → `/redeem` |

```mermaid
flowchart TD
  QR[QR /cart?serial=] --> Start[POST /api/cart/session/start]
  Start --> Paid{voucher.paymentStatus?}
  Paid -->|yes| Redeem[/redeem]
  Paid -->|no| Plans[/cart/plans]
  Plans --> Pay[Stripe / MP]
  Pay --> WH[authorizePrepaidAfterPayment]
  WH --> Redeem
  POS[POS pay] --> POSAPI[POST /api/pos/activate]
  POSAPI --> Auth[authorizePrepaidAfterPayment]
  Auth --> Redeem
```

---

## Implementation checklist

### Block 1 — Schema & shared authorize

| Step | Task | Status |
|------|------|--------|
| 1.1 | `PrepaidCard`: `barcodePayload`, `retailMarket`, `faceValueCents`, `gtin` | done |
| 1.2 | `CartPurchase`: `paymentSource`, `externalPaymentRef` (idempotent) | done |
| 1.3 | `src/lib/prepaid-authorize.ts` — single post-payment authorize | done |
| 1.4 | Refactor `src/app/api/stripe/webhook/route.ts` to use authorize helper | done |

### Block 2 — Path B routing (D2C fork)

| Step | Task | Status |
|------|------|--------|
| 2.1 | `src/lib/prepaid-paid-redirect.ts` — build redeem URL when paid | done |
| 2.2 | `POST /api/cart/session/start` — return `redirect` if already paid | done |
| 2.3 | `CartPhoneVerifyClient` — follow API redirect | done |
| 2.4 | `/cart/plans` — server redirect if paid | done |
| 2.5 | `POST /api/cart/checkout` — reject double payment | done |

### Block 3 — POS API

| Step | Task | Status |
|------|------|--------|
| 3.1 | Retailer auth (`POS_API_KEY`, `src/lib/pos-auth.ts`) | done |
| 3.2 | `POST /api/pos/activate` | done |
| 3.3 | Block dealer unlock for `prepaidCard` vouchers | done |

### Block 4 — D2C checkout rules

| Step | Task | Status |
|------|------|--------|
| 4.1 | Pre-fill pay amount from `faceValueCents` | done |
| 4.2 | Loosen strict `basePlanId` checkout match (market-based) | done |
| 4.3 | Mercado Pago preference + webhook → authorize helper | done |

### Block 5 — Phase 2 polish

| Step | Task | Status |
|------|------|--------|
| 5.1 | `redeem/start` Path B error copy | done |
| 5.2 | `redeep/quote` filter by `retailMarket` | done |

### Block 6 — Admin

| Step | Task | Status |
|------|------|--------|
| 6.1 | Admin prepaid CSV import (`/admin/prepaid`) | done |
| 6.2 | Tracking: payment source + external ref | done |

### Block 7 — QA

| Step | Task | Status |
|------|------|--------|
| 7.1 | Path B test matrix (doc below) | manual |

### Gap fixes (feedback audit 2026-05-21)

| Gap | Status |
|-----|--------|
| BR/UK plan catalogs in seed | done |
| `eligible` voucher status on POS/D2C pay | done |
| Mercado Pago Phase 2 upgrade (BR) | done |
| D2C checkout locked to `faceValueCents` | done |
| Plan list shows wallet coverage / upgrade due | done |
| GS1/barcode validation on import | done |
| `.env.example` POS + MP | done |
| Dealer scan UI (`/dealer/scan`) | done |
| i18n dealer + new cart/redeem strings (de, fr, nl, pt) | done |

---

## Key modules

| Module | Role |
|--------|------|
| `src/lib/prepaid-authorize.ts` | Create `CartPurchase`, tokens, voucher `paymentStatus` + credit |
| `src/lib/prepaid-paid-redirect.ts` | Paid card → `/redeem?purchaseId&access` |
| `src/lib/prepaid-cart.ts` | Serial/barcode normalize, session bind |
| `src/lib/prepaid-payment-source.ts` | `stripe` \| `mercadopago` \| `pos` constants |

---

## Test matrix (Path B)

1. Unpaid card: `/cart?serial=` → plans → Stripe → redeem with PIN.
2. POS activate → same serial in `/cart` → redirect to redeem (no second charge).
3. Paid card: direct `/cart/plans` → redirect away.
4. Paid card: `POST /api/cart/checkout` → 409.
5. POS duplicate `externalPaymentId` → idempotent same purchase.
6. D2C pay then POS on same card → second activation rejected.
7. PIN → SMS → plan price > credit → Stripe top-up → activate.

---

## Environment

| Variable | Purpose |
|----------|---------|
| `POS_API_KEY` | Bearer or `X-POS-API-Key` for `POST /api/pos/activate` |
| `MERCADOPAGO_ACCESS_TOKEN` | Mercado Pago API (preferences + payments) |
| `NEXT_PUBLIC_CART_MERCADOPAGO_ENABLED` | `true` to show Mercado Pago button on `/cart/plans` |

### POS activate example

```http
POST /api/pos/activate
Authorization: Bearer <POS_API_KEY>
Content-Type: application/json

{
  "scanType": "barcode",
  "scanValue": "USALOCALDEMO123",
  "amountCents": 5000,
  "currency": "USD",
  "externalPaymentId": "store-42-txn-9001"
}
```

---

## Client message

> Scan at the store loads your wallet automatically. Scan at home only opens checkout if the card is not paid yet. Everyone redeems with the scratch PIN and SMS on the same portal.
