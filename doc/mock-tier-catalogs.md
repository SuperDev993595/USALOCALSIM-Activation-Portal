# Mock PRO & ULTRA tier catalogs

**Status:** Aligned with card design (June 2026). PRO = Three UK only; ULTRA = Orange only (eSIM). Orange ULTRA SKUs from client PDFs (June 2026).

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

## ULTRA tier — `src/lib/orange-ultra-catalog.ts`

Network: **ORANGE** only  
Market in DB: `global`  
Formats: **eSIM only** (enforced in UI + quote)

| SKU | Family | Data | Days | USD |
|-----|--------|------|------|-----|
| ULT-ORG-EU-100GB-31D | Europe | 100 GB | 31 | $31.99 |
| ULT-ORG-EU-200GB-31D | Europe | 200 GB | 31 | $51.99 |
| ULT-ORG-EU-500GB-31D | Europe | 500 GB | 31 | $111.99 |
| ULT-ORG-WLD-20GB-31D | World | 20 GB | 31 | $25.99 |
| ULT-ORG-WLD-50GB-31D | World | 50 GB | 31 | $39.99 |
| ULT-ORG-WLD-100GB-31D | World | 100 GB | 31 | $54.99 |

Marketing page: `/plans/orange` (product info only — no Orange-specific redeem route)

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

1. Replace or extend `pro-tier-catalog-mock.ts` / `orange-ultra-catalog.ts`.
2. Update imports in `prisma/seed-tier-catalogs.ts`.
3. Re-run `npm run db:seed` (retired SKUs and misaligned tier/network rows are deactivated automatically).
