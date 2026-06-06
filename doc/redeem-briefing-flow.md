# Redeem flow (feedback 2026-05-28)

Default production flow matches the client briefing (`doc/feedback/feedback-2026-05-28.md`).

## Steps

| Step | Route / UI | Behavior |
|------|------------|----------|
| 1 | `/redeem/enter` | Scratch voucher code; reject if retailer has not activated (POS). |
| 2 | `/redeem` or `/redeem/three-uk?purchaseId=…` | SMS verification on service phone. |
| 3 | Global: network picker (4 carriers). Three UK batch: skip → `three_uk` auto-selected. |
| 4 | Fulfillment + plan list; baseline plans match voucher credit (perfect match). |
| 5 | Upgrade plans show balance due; Stripe checkout for the difference. |

## Global networks (step 3)

All four active carriers: **THREE UK**, **LINKUP & AT&T MOBILE**, **T-MOBILE**, **ORANGE**.

Plans are filtered by selected network and allowed markets (`src/lib/redeem-plan-markets.ts`).

## Optional card-design flow

Set `REDEEM_USE_TIER_STEP=true` to insert BASIC / PRO / ULTRA before network selection (tier-filtered carriers).

## Seed

Run `npx prisma db seed` to load `GLOBAL_BRIEFING_PLANS` ($35 perfect-match SKUs for T-Mobile, Three UK, Orange) plus existing tier catalogs.

## Three UK marketing URL (inject on cards / external sites)

**Public plans page (no voucher required):**

`https://<your-domain>/redeem/three-uk`

Shows Three UK branding, live plan list from the database, and **Activate your voucher** → `/redeem/enter`.

After a Three UK exclusive voucher is entered, the same path continues as the redeem wizard (`?purchaseId=…&access=…`).

## Deploy note

On Vercel, **do not** set `REDEEM_USE_TIER_STEP=true` unless you intentionally want the tier card flow. Unset = briefing flow.
