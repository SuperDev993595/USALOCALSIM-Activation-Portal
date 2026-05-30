# Mock PRO & ULTRA tier catalogs

**Status:** Placeholder until the client sends final SKU matrices.  
**Replace with:** Client blocks for PRO (72 countries) and ULTRA (200+ countries, eSIM only).

Run seed after migrations:

```bash
npm run db:seed
```

---

## PRO tier (MOCK) — `src/lib/pro-tier-catalog-mock.ts`

Networks: **THREE UK**, **ORANGE**  
Market in DB: `global`  
Formats: Physical SIM + eSIM (same price)

| SKU | Network | Data | Days | USD |
|-----|---------|------|------|-----|
| PRO-3UK-10GB-30D | Three UK | 10 GB | 30 | $35.00 |
| PRO-3UK-25GB-30D | Three UK | 25 GB | 30 | $45.00 |
| PRO-3UK-UNL-14D | Three UK | Unlimited | 14 | $39.00 |
| PRO-ORG-12GB-30D | Orange | 12 GB | 30 | $35.00 |
| PRO-ORG-20GB-30D | Orange | 20 GB | 30 | $42.00 |
| PRO-ORG-UNL-30D | Orange | Unlimited | 30 | $49.00 |

**$35 voucher test:** PRO-3UK-10GB-30D or PRO-ORG-12GB-30D (perfect match).

---

## ULTRA tier (MOCK) — `src/lib/ultra-tier-catalog-mock.ts`

Networks: all four (THREE UK, ORANGE, T-MOBILE, LINKUP & AT&T)  
Market in DB: `global`  
Formats: **eSIM only** (enforced in UI + quote)

| SKU | Network | Data | Days | USD |
|-----|---------|------|------|-----|
| ULT-3UK-15GB-30D | Three UK | 15 GB | 30 | $35.00 |
| ULT-3UK-UNL-30D | Three UK | Unlimited | 30 | $49.00 |
| ULT-ORG-15GB-30D | Orange | 15 GB | 30 | $35.00 |
| ULT-ORG-UNL-30D | Orange | Unlimited | 30 | $48.00 |
| ULT-TM-20GB-30D | T-Mobile | 20 GB | 30 | $35.00 |
| ULT-TM-UNL-30D | T-Mobile | Unlimited | 30 | $50.00 |
| ULT-ATT-12GB-30D | LINKUP & AT&T | 12 GB | 30 | $35.00 |
| ULT-ATT-30GB-30D | LINKUP & AT&T | 30 GB | 30 | $45.00 |

**Note:** T-Mobile add-ons do not apply on ULTRA (different product line); only BASIC T-Mobile plans show add-ons.

---

## Quote market routing

| Tier | Plan `market` filter |
|------|----------------------|
| BASIC | `us` (or `uk` / `br` from card `retailMarket`) |
| PRO | `global` |
| ULTRA | `global` |

Implemented in `planMarketForTier()` (`src/lib/tier-plan-seed.ts`).

---

## When client sends real data

1. Add `pro-tier-catalog.ts` / `ultra-tier-catalog.ts` (or replace `-mock` files).
2. Update `PRO_TIER_MOCK_PLANS` / `ULTRA_TIER_MOCK_PLANS` imports in `prisma/seed-tier-catalogs.ts`.
3. Re-run `npm run db:seed`.

Plans are stored with **`Plan.sku`** (catalog code) and a display **`name`** (no SKU in the title). Redeem UI shows SKU above the plan name.
