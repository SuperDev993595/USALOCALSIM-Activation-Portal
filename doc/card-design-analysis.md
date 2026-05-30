# Global Data Credit — Physical Voucher Card Design Analysis

**Source artwork:** [card design.jpeg](./card%20design.jpeg)  
**Product:** USALOCALSIM.COM — Global Data Credit prepaid voucher  
**Example denomination:** $35  
**Document purpose:** Detailed breakdown of layout, copy, identifiers, user flow, and portal alignment for design, print, and engineering teams.

---

## 1. Executive summary

The card is a **dual-sided retail prepaid voucher** for international mobile data credit. It combines:

- **Point-of-sale purchase** via QR code (“Scan to Pay”)
- **Scratch-off PIN redemption** on the activation portal
- **Tiered coverage** (Basic / Pro / Ultra) that the customer selects after verification

The design positions the product as a **flexible wallet** (“Global Data Credit”) rather than a fixed plan on the card face. The $35 shown is the **credit value** loaded onto the voucher; the customer redeems that credit against data bundles in the portal after SMS verification.

**Primary customer journey (as printed on card):**

```
Pay → Scratch → Redeem
```

Expanded flow implied by back-of-card copy:

```
Scan QR & pay → Visit redeem URL → Enter PIN → SMS verify → Choose plan (and optional SIM shipping)
```

---

## 2. Physical format and layout

| Attribute | Observation |
|-----------|-------------|
| **Orientation** | Portrait (vertical), typical gift-card / telecom voucher proportions |
| **Sides** | Front (marketing + purchase QR) and back (instructions + PIN + barcodes) |
| **Corners** | Rounded — standard for wallet-sized cards and retail displays |
| **Scratch area** | Grey textured rectangle on back, under “SCRATCH FOR PIN” header |
| **Print regions** | Clear separation between retail barcode (EAN), redemption PIN, and Code 128 serial |

The card is designed for **retail shelf display** (price badge, tier comparison, carrier logos) and **post-purchase use** (how-it-works, PIN, legal footers).

---

## 3. Front side — section-by-section

### 3.1 Header — price and product title

| Element | Content | Role |
|---------|---------|------|
| Price badge | **$35** (red square, top-left) | Denomination / credit amount at retail |
| Main title | **GLOBAL DATA CREDIT** | Product category — wallet credit, not a named plan |
| Subtitle | **Activate Data Bundles Worldwide** | Value proposition |

The price badge uses high-contrast red on white type so it reads from a distance on a peg hook or counter stand.

### 3.2 Brand block

| Element | Content |
|---------|---------|
| Logo | Globe icon + **USALOCALSIM.COM** |
| Tagline | ★ **Global Connectivity, Local Freedom** ★ |
| Product type pill | **PREPAID VOUCHER** (red rounded button) |

Establishes brand and clarifies that this is **prepaid credit**, not a subscription.

### 3.3 Key selling points (icon row)

Two circular feature callouts:

| Icon | Label | Meaning |
|------|-------|---------|
| Infinity (∞) | **NO EXPIRATION** | Credit does not expire (also repeated on back) |
| SIM card | **SIM & eSIM READY** | Supports physical SIM and eSIM redemption paths |

These align with portal scenarios: physical ICCID + voucher (combo) and eSIM-only voucher.

### 3.4 Coverage tiers (three horizontal bars)

Each tier is a color-coded arrow bar with icon, name, geography, and SIM modality.

| Tier | Color | Icon | Coverage | SIM support |
|------|-------|------|----------|-------------|
| **BASIC** | Green | Statue of Liberty | USA • CANADA • MEXICO | SIM & eSIM |
| **PRO** | Blue | Globe | 72 COUNTRIES | SIM & eSIM |
| **ULTRA** | Red | Globe | 200+ COUNTRIES | **eSIM ONLY** |

**Design intent:** The card sells **one credit amount** ($35) but communicates **upgrade paths** — customer chooses tier/plan at redemption based on destination and device. Ultra explicitly restricts to eSIM, which must be enforced in the portal plan filter.

**Portal implication:** After PIN entry and SMS OTP, the customer should see plans grouped or filtered by network/tier (Basic vs Pro vs Ultra coverage), consistent with `doc/feedback/implementation-checklist.md` network-picker requirements.

**BASIC tier catalog (client block 1):** See [basic-tier-catalog.md](./basic-tier-catalog.md) for T-Mobile unlimited + AT&T/LINKUP limited SKUs, $35 perfect-match mapping, and seed instructions.

### 3.5 Scan to Pay (purchase QR)

| Element | Content |
|---------|---------|
| Section title | **SCAN TO PAY** (yellow) |
| Visual | Hand + phone scanning illustration |
| QR code | Large, white field with yellow border — primary D2C / self-serve purchase entry |
| CTA button | **SCAN & BUY** |
| Flow hint | **Pay → Scratch → Redeem** |

This QR likely resolves to a cart or prepaid flow (e.g. `/cart?serial=…` per Path B hybrid implementation). Payment unlocks the voucher; scratching reveals the PIN for `/redeem`.

**Note:** Bitcoin is highlighted as “EXCLUSIVE PAYMENT OPTION” on the front — a product/marketing choice that may differ from Stripe/card checkout in the current portal; confirm whether QR lands on crypto-only or multi-rail checkout.

### 3.6 Trust and carrier strip

| Element | Content |
|---------|---------|
| Payment | **BITCOIN ACCEPTED** — “EXCLUSIVE PAYMENT OPTION” |
| Networks header | **POWERED BY LEADING GLOBAL NETWORKS** |
| Logos | T-Mobile, AT&T, Vodafone, Orange, 3 (Three), LINKUP MOBILE, TRUMP MOBILE |

Carrier logos signal **multi-network** capability and support the Basic/Pro/Ultra tier story. Engineering should map these to selectable networks in the Global voucher redemption flow.

### 3.7 Front footer

| Left | Right |
|------|-------|
| Globe + **USE YOUR CREDIT TO UNLOCK DATA BUNDLES WORLDWIDE** | Shield + **SAFE, FAST & SECURE** |

Reinforces wallet model and security before purchase.

---

## 4. Back side — section-by-section

### 4.1 Product identification (EAN)

| Element | Example on mockup | Purpose |
|---------|-------------------|---------|
| Label | **PRODUCT IDENTIFICATION (EAN)** | Retail POS scanning |
| Barcode | Standard EAN-13 style | Checkout at physical retail |
| Number | `1234567890128` | Placeholder — assign real EAN per SKU/denomination |

**Ops note:** Each denomination ($35, other values) may need a distinct EAN if sold as separate SKUs.

### 4.2 How it works (three steps)

Dark navy header: **HOW IT WORKS**

| Step | Title | Instruction |
|------|-------|-------------|
| 1 | **SCAN & PAY** | Scan the QR code to pay and purchase your credit instantly. |
| 2 | **GO TO REDEEM/VOUCHER** | Visit **www.redeem/voucher** — scratch and enter your PIN to redeem your credit. |
| 3 | **VERIFY & CHOOSE PLAN** | Verify via SMS and explore data plans, upgrades, and shipping (if needed). |

**Portal mapping:**

| Card step | Expected system behavior |
|-----------|-------------------------|
| Scan & Pay | QR → cart/checkout → voucher marked paid / eligible |
| Redeem | `/redeem` (or printed URL) → PIN entry → access token / purchase session |
| Verify & choose | SMS OTP → plan catalog filtered by tier/network → optional upgrade payment → activation queue |

**Copy issue:** Step 2 URL `www.redeem/voucher` is not a valid hostname as printed. Production should use a real URL, e.g. `redeem.usalocalsim.com` or `www.usalocalsim.com/redeem`, matching DNS and the deployed app.

### 4.3 Scratch-for-PIN block

| Element | Example on mockup | Notes |
|---------|-------------------|-------|
| Header | **SCRATCH FOR PIN** (red bar) | Security — PIN hidden until purchase |
| Scratch panel | Grey scratch-off overlay | Reveals secret PIN |
| PIN format | `1234 5678 1234` (12 digits, grouped) | Define generation, validation, and display format in backend |
| Serial (S/N) | `USL 00000001` | Human-readable serial; may tie to QR/cart `serial` param |

PIN is the **customer-facing redemption secret**; S/N supports support desk lookup and barcode correlation.

### 4.4 Code 128 barcode

| Element | Example on mockup |
|---------|-------------------|
| Label | **CODE 128** |
| Payload | `T8985644511605212020212356544` |

Long alphanumeric string suitable for **warehouse scanning, batch tracking, or dealer unlock**. Should map 1:1 to voucher record in database (alongside PIN hash and serial).

Aligns with admin barcode generator and dealer POS activation flows documented in `doc/admin-barcode-generator.md` and Path B hybrid docs.

### 4.5 Policy icon bar (dark navy)

Four icons with short legal/ policy text:

| Icon | Text |
|------|------|
| Shield | **NON-REFUNDABLE** once scratched |
| Calendar | **NO EXPIRATION** date |
| Smartphone | **DEVICE COMPATIBILITY** required |
| Globe | **GLOBAL COVERAGE** |

These are **terms at a glance** for retail compliance. Portal should surface full terms elsewhere; “non-refundable once scratched” implies PIN reveal = final sale from a policy perspective.

### 4.6 Back footer

| Element | Content |
|---------|---------|
| Website | **www.usalocalsim.com** |
| Lot line | **LOT: USL-2026-01 \| MADE FOR GLOBAL TRAVEL** |
| Footnote | *Physical SIM shipping available at checkout (if you don't have a SIM).* |

Lot code supports **print batch traceability**. Footnote confirms optional physical SIM fulfillment during redemption checkout — matches combo / ship-SIM flows in the activation portal.

---

## 5. Visual design system

### 5.1 Color palette

| Color | Usage |
|-------|--------|
| **Dark navy blue** | Primary background (front), section headers (back) |
| **Red** | Price badge, Ultra tier, CTAs, PIN/S/N accents, scratch header |
| **Green** | Basic tier bar |
| **Blue** | Pro tier bar |
| **Yellow / gold** | Scan-to-pay emphasis, QR frame, secondary CTAs |
| **White** | Back background, body text on dark areas |
| **Grey** | Scratch-off panel texture |

Tier colors create **instant scannable differentiation** for sales staff and customers comparing products on the rack.

### 5.2 Typography and hierarchy

- **Bold condensed sans-serif** for product name, tier names, and CTAs
- **Large numerals** for price ($35) and PIN placeholder
- **Small caps / regular** for legal and footer metadata
- **Yellow on navy** for high-visibility payment zone

### 5.3 Iconography

- Globe (brand, Pro/Ultra, coverage)
- Statue of Liberty (Basic — Americas positioning)
- Infinity (no expiration)
- SIM chip (dual SIM/eSIM)
- Shield (security, non-refundable)
- Step illustrations (phone scan, browser, SMS bubble)

---

## 6. Identifiers and data model (engineering view)

The mockup exposes **four distinct identifiers** that the backend should relate:

| Identifier | Example | Typical use |
|------------|---------|-------------|
| **EAN** | 1234567890128 | Retail POS sale |
| **QR (front)** | (encoded URL) | D2C payment / cart entry |
| **PIN** | 1234 5678 1234 | Customer redemption secret |
| **S/N** | USL 00000001 | Support, serial on card face |
| **Code 128** | T8985644511605212020212356544 | Logistics / dealer / admin scan |

Suggested lifecycle (aligned with `doc/instructions.md`):

```
inactive (stock) → activated/eligible (sold / paid) → redeemed (PIN used, plan chosen)
```

For Path B prepaid cards, payment may set `paymentStatus` before PIN redemption; dealer-sold cards may use dealer unlock instead of QR pay.

---

## 7. Alignment with activation portal

| Card element | Portal / doc reference |
|--------------|------------------------|
| Pay → Scratch → Redeem | Path B: `/cart` → pay → `/redeem` with PIN |
| SMS verify | Redeem flow OTP step |
| Choose plan + upgrades | Plan catalog, network picker, Stripe upgrade (checklist slice 3) |
| SIM & eSIM | Combo (ICCID + voucher) vs eSIM-only voucher scenarios |
| Physical SIM shipping | Checkout/shipping option at redeem |
| Dealer / retail | Dealer unlock, bulk activation, Code 128 admin tools |
| Manual fulfillment | Request queue until admin “Mark as Active” (`doc/project description.md`) |

**Gaps to resolve before print:**

1. Final redemption URL (replace placeholder `www.redeem/voucher`)
2. Whether Bitcoin-only copy matches actual checkout rails
3. Exact mapping of Basic / Pro / Ultra to plan SKUs and networks in DB
4. Real EAN and Code 128 allocation per batch (`LOT: USL-2026-01`)

---

## 8. Copy and design QA issues

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Invalid URL | Back step 2: `www.redeem/voucher` | Use production redeem URL; verify SSL and short-link if space-constrained |
| Typo risk | Front subtitle (artwork) | Confirm “Worldwide” spelling in final print file |
| “Exclusive” Bitcoin | Front payment strip | Align with legal/commerce if card also sold via Stripe at retail |
| ULTRA “eSIM ONLY” | Front tier bar | Enforce in UI — hide physical-SIM / ICCID path for Ultra-only vouchers |
| Placeholder PIN/S/N/EAN | Back mockup | Replace with “XXXX” pattern in design spec; never use real secrets in artwork |
| TRUMP MOBILE logo | Carrier strip | Confirm licensing/approval for all carrier marks before mass print |

---

## 9. Retail and operations checklist

- [ ] Assign EAN per SKU (denomination × region if needed)
- [ ] Generate PIN + Code 128 + S/N per card; store PIN hashed
- [ ] Link front QR to cart serial or payment deep link
- [ ] Print lot number on back for batch recall
- [ ] Dealer training: unlock at sale (if not QR-paid), scratch only after payment
- [ ] Support scripts: lookup by S/N, Code 128, or PIN (last 4)
- [ ] Match email/plan templates to tier customer selects at redemption

---

## 10. Summary

The card design implements a **two-phase product**: (1) **monetize credit** at retail or via QR, (2) **consume credit** on the web portal with PIN + SMS and optional plan upgrade. The front side sells **freedom and tiered geography**; the back side operationalizes **identification, instructions, and secrets**. For a successful launch, print artwork must be synchronized with live URLs, voucher schema, network/plan catalog, and payment methods documented in this repository’s activation and Path B hybrid specs.

---

*Analysis generated from `doc/card design.jpeg` — May 2026.*
