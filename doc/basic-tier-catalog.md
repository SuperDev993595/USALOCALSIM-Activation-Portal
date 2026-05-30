# BASIC tier catalog — USA · Canada · Mexico

**Card tier:** GREEN **BASIC** bar on physical voucher ([card-design-analysis.md](./card-design-analysis.md))  
**Client spec:** [T-MOBILE AND LINKUP MOBILE POWERED BY AT&T.md](./T-MOBILE%20AND%20LINKUP%20MOBILE%20POWERED%20BY%20AT&T.md)  
**Reference product (T-Mobile unlimited, North America):** [sim-usa.mobi — 14 days unlimited USA/Canada/Mexico](https://sim-usa.mobi/product/usa-canada-mexico-unlimited-data-14-days/)

**Sibling tiers (not in this doc yet):** PRO (72 countries), ULTRA (200+ countries, eSIM only).

---

## 1. How BASIC fits the card and redeem flow

The voucher loads **credit** (e.g. **$35**). The customer does **not** buy a fixed plan on the card face. At redeem:

1. Scratch PIN → SMS verify  
2. Choose **tier** (BASIC / PRO / ULTRA) — *portal: tier filter TBD; today: network picker*  
3. Under **BASIC**, choose **network** → **plan** → optional **add-ons** (T-Mobile only) → pay difference if needed  

```
$35 voucher (example)
  └─ BASIC (USA · Canada · Mexico)
       ├─ T-Mobile unlimited (TM-UNL-*D)     → from $39 → upgrade +$4+
       └─ AT&T / LINKUP limited (ATT-LIM-*)  → ATT-LIM-30GB = $35 exact match
```

---

## 2. Product line 1 — T-Mobile unlimited

| Attribute | Value |
|-----------|--------|
| **Network slug** | `t_mobile` |
| **Brand color** | `#E20074` (Magenta) |
| **Formats** | Physical SIM & eSIM (same price) |
| **Base features** | Unlimited USA data, free USA number, unlimited USA SMS, unlimited USA local calls |

### Core SKUs

| SKU | Name (seed) | Duration | Price (USD) | Price (cents) |
|-----|-------------|----------|-------------|---------------|
| TM-UNL-10D | T-Mobile Unlimited — 10 days | 10 days | $39.00 | 3900 |
| TM-UNL-20D | T-Mobile Unlimited — 20 days | 20 days | $44.00 | 4400 |
| TM-UNL-30D | T-Mobile Unlimited — 30 days | 30 days | $49.00 | 4900 |

**Portal:** `Plan.market = us`, `Plan.networkId` → T-Mobile, `planType` = `physical_sim` or `esim` (seed creates both).

### T-Mobile-only add-ons (UI not built yet)

Show **only** after user selects a T-Mobile core plan (checkboxes / toggles).

| SKU | +USD | Label | Description |
|-----|------|-------|-------------|
| ADD-TM-MXCA | $5.00 | Canada & Mexico Data Coverage | +5GB high-speed roaming in Canada & Mexico |
| ADD-TM-INTL | $15.00 | North America Stateside International Calling | Unlimited intl landline calls from USA |
| ADD-TM-COMBO | $20.00 | Full North America Roaming & Calling Combo | Intl calling while roaming USA/MX/CA + 5GB roaming data |

**Do not** offer these add-ons when an AT&T/LINKUP plan is selected.

### Comparison to sim-usa.mobi (reference only)

| sim-usa.mobi option | Client BASIC / T-Mobile |
|---------------------|-------------------------|
| Network: T-Mobile | Same product line |
| USA only vs USA+Canada+Mexico | Similar to **ADD-TM-MXCA** (site: unlimited CA/MX, throttle after 5GB) |
| Direct international calling Yes/No | Similar to **ADD-TM-INTL** / **ADD-TM-COMBO** |
| 7 / 14 / 30 day variants | Client uses **10 / 20 / 30** days and **$39 / $44 / $49** |
| eSIM free, physical SIM +$4 | Client: **same price** both formats |

Use **client SKUs and prices** in production, not sim-usa.mobi list prices.

---

## 3. Product line 2 — AT&T / LINKUP limited

| Attribute | Value |
|-----------|--------|
| **Network slug** | `linkup_att` |
| **Brand color** | `#00A3E0` |
| **Validity** | 30 days (all SKUs) |
| **Formats** | Physical SIM & eSIM (same price) |
| **Base features** | Fixed data, free USA number, local calls, international calls & SMS (included in base) |

### Core SKUs

| SKU | Name (seed) | Data | Duration | Price (USD) | Price (cents) | $35 voucher |
|-----|-------------|------|----------|---------------|---------------|-------------|
| ATT-LIM-12GB | LINKUP & AT&T — 12 GB / 30 days | 12 GB | 30 days | $30.00 | 3000 | Under credit ($5 leftover policy TBD) |
| ATT-LIM-30GB | LINKUP & AT&T — 30 GB / 30 days | 30 GB | 30 days | $35.00 | 3500 | **Perfect match** |
| ATT-LIM-50GB | LINKUP & AT&T — 50 GB / 30 days | 50 GB | 30 days | $45.00 | 4500 | Upgrade +$10 |

No conditional add-ons for this line (intl/roaming baked into base price).

---

## 4. Database seeding

Run after migrations (includes `Network` + `Plan.networkId`):

```bash
npx prisma migrate deploy
npm run db:seed
```

Seed logic: `prisma/seed.ts` → `seedTierCatalogs()` — BASIC + mock PRO/ULTRA (see [mock-tier-catalogs.md](./mock-tier-catalogs.md)).

---

## 5. Portal implementation status

| Feature | Status |
|---------|--------|
| Networks `t_mobile`, `linkup_att` | ✅ Seeded |
| Plans per network (this doc) | ✅ Seeded via `db:seed` |
| Network picker after SMS | ✅ Global voucher |
| Perfect-match grouping ($35) | ✅ Quote + redeem UI |
| Tier step BASIC / PRO / ULTRA | ✅ After SMS on global voucher |
| T-Mobile add-on checkboxes | ✅ Plan step when network is T-Mobile |
| Brand colors on network step | ❌ Not built |

---

## 6. Open questions for client

1. Does **$35** retail SKU map only to **ATT-LIM-30GB**, or also to a T-Mobile SKU?  
2. Are **LINKUP** and **AT&T** one shared catalog (as spec’d) or separate networks in UI?  
3. Can T-Mobile add-ons be **stacked** (MXCA + INTL), or only one / combo only?  
4. When ready: send **PRO** and **ULTRA** blocks (networks, SKUs, prices) same format as BASIC.

---

## 7. Related docs

- [feedback-2026-05-28.md](./feedback/feedback-2026-05-28.md) — voucher flow  
- [implementation-checklist.md](./feedback/implementation-checklist.md) — engineering checklist  
- [card-design-analysis.md](./card-design-analysis.md) — physical card artwork
