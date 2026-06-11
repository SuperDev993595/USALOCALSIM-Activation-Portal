# Mock PRO & ULTRA tier catalogs

**Status:** Aligned with card design (June 2026). PRO = Three UK only; ULTRA = Orange only (eSIM).

Run seed after migrations:

```bash
npm run db:seed
```

---

## PRO tier — `src/lib/pro-tier-catalog-mock.ts`

Network: **THREE UK** only  
Market in DB: `global`  
Formats: Physical SIM + eSIM

| SKU | Network | Data | Days | USD |
|-----|---------|------|------|-----|
| PRO-3UK-10GB-30D | Three UK | 10 GB | 30 | $35.00 |
| PRO-3UK-25GB-30D | Three UK | 25 GB | 30 | $45.00 |
| PRO-3UK-UNL-14D | Three UK | Unlimited | 14 | $39.00 |

---

## ULTRA tier — `src/lib/ultra-tier-catalog-mock.ts`

Network: **ORANGE** only  
Market in DB: `global`  
Formats: **eSIM only** (enforced in UI + quote)

| SKU | Network | Data | Days | USD |
|-----|---------|------|------|-----|
| ULT-ORG-15GB-30D | Orange | 15 GB | 30 | $35.00 |
| ULT-ORG-UNL-30D | Orange | Unlimited | 30 | $48.00 |

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

1. Replace or extend `pro-tier-catalog-mock.ts` / `ultra-tier-catalog-mock.ts`.
2. Update imports in `prisma/seed-tier-catalogs.ts`.
3. Re-run `npm run db:seed` (retired SKUs and misaligned tier/network rows are deactivated automatically).
