# Redeem flow (card-design tier flow)

Default production flow: **BASIC / PRO / ULTRA first** — network is auto-assigned, no manual picker.

## Steps

| Step | Route / UI | Behavior |
|------|------------|----------|
| 1 | `/redeem/enter` | Scratch voucher code; reject if retailer has not activated (POS). |
| 2 | `/redeem` or `/redeem/three-uk?purchaseId=…` | SMS verification on service phone. |
| 3 | **Configure your service** | **BASIC / PRO / ULTRA** (left) + **network display** (right) → auto-loaded data plans + SIM type. |
| 4 | Payment + activation date | Upgrade balance via Stripe when applicable. |

## Tier → auto network → plans

| Tier | Auto network | Plans shown |
|------|--------------|-------------|
| **BASIC** | T-Mobile | USA T-Mobile plans |
| **PRO** | Three UK | Three UK PRO plans |
| **ULTRA** | Orange | Orange eSIM plans |

Implemented in `src/lib/coverage-tier.ts` (`NETWORK_SLUG_FOR_TIER`) and `POST /api/redeem/tier/select`.

## Legacy briefing flow (optional)

Set `REDEEM_USE_TIER_STEP=false` to restore SMS → four network logos → plans (no tier step).

## Seed

Run `npx prisma db seed` to load BASIC, PRO (Three UK), ULTRA (Orange), and briefing SKUs.

## Three UK marketing URL

`https://<your-domain>/redeem/three-uk` — Three UK exclusive vouchers skip tier/network and auto-select `three_uk`.

## USA BASIC exclusive marketing URLs (feedback 2026-07-01)

| Batch | URL | Behavior |
|-------|-----|----------|
| **T-Mobile exclusive** | `/redeem/t-mobile` | T-Mobile BASIC plans only; tier/network skipped |
| **LINKUP & AT&T exclusive** | `/redeem/linkup-att` | 12GB / 30GB / 50GB only; upgrade at redeem |

Scratch PIN prefixes: `USLTM-` (T-Mobile), `USLATT-` / `USLLU-` (Linkup). See `doc/scratch-pin-formats.md`.

**LINKUP entry bundle (D2C cart):** `linkup_att` + **$30 face value** + base plan **`ATT-LIM-12GB`** → credit checkout at `/cart/plans`. Enforced in admin import/generate and checkout APIs.

## Deploy note

Tier flow is **on by default**. Set `REDEEM_USE_TIER_STEP=false` on Vercel only if you intentionally want the legacy four-logo flow.
