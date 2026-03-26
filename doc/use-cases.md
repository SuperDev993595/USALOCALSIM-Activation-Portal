# USALOCALSIM Activation Portal — Use Cases

This document describes **actors**, **primary use cases**, **alternative flows**, and **out-of-scope** behavior for the activation portal. It aligns with `README.md`, `doc/project description.md`, `doc/development-plan.md`, and `doc/feature-verification.md`.

---

## 1. System overview

| Item | Description |
|------|-------------|
| **Purpose** | Capture activation requests (voucher and/or paid plan), store a **travel date**, route **Buy plan** payments through **Stripe**, enqueue submissions as **scheduled** for **manual** fulfillment, and send **success email** only after **Admin Mark as Active**. |
| **Tech context** | Next.js 14 (App Router), MySQL + Prisma, NextAuth (admin/dealer), Stripe Checkout + webhook, next-intl (7 locales), Nodemailer and/or Resend for email. Per-market SIM hardware deduction via **`SimHardwareCostByMarket`**. |

---

## 2. Actors

| Actor | Description |
|-------|-------------|
| **Customer** | End user submitting activation on the public site. |
| **Dealer** | Authenticated user who **unlocks** voucher codes after sale (`inactive` → `activated`). |
| **Admin** | Authenticated user who imports vouchers, views queue, marks activations **active**, and views tracking. |
| **System** | Validates input, enforces voucher lifecycle, rate limits, Stripe integration, emails, persistence, audit logs. |

---

## 3. Primary use cases

**Request lifecycle (all flows)** — New rows are created with status **`scheduled`** (paid via Stripe webhook, or voucher via **`/api/submit`**). Admin uses **Mark as Active** on **`/admin`**; the API sets status **`active`**, sends the success email, and sets **`completedAt`** / **`completedById`**. The customer-facing **`/activate/success`** page can poll **`/api/activate/status`** and shows **Payment Confirmed** / scheduled copy until the row becomes **`active`**, then **Your SIM is now Active**.

---

### UC-1 — Customer: Buy plan (paid physical SIM service)

| Field | Content |
|-------|---------|
| **Goal** | Customer pays for a **physical SIM** data plan via card; optional **partner SIM** hardware deduction. |
| **Actors** | Customer, System, Stripe, Admin (later). |
| **Preconditions** | `physical_sim` plans in DB; Stripe and env vars configured; **`SimHardwareCostByMarket`** defines hardware cents per market (`global` / `us`). |
| **Trigger** | Customer opens **`/activate/buy-plan`**. |

**Main success scenario**

1. Customer optionally enables **I already have a SIM card from a partner** (`hasPartnerSim`). Plans reload from **`GET /api/plans/public?hasPartnerSim=…`**: shown **plan price minus** configured hardware cost when enabled.
2. Customer selects a **plan**, enters **email** and **travel date** (required).
3. **`POST /api/stripe/checkout`** creates **Stripe Checkout** (no ICCID on this path; metadata carries **`planId`**, **`travelDate`**, **`hasPartnerSim`**, hardware deduction cents).
4. Customer completes payment.
5. **`POST /api/stripe/webhook`** (`checkout.session.completed`) creates **`ActivationRequest`** with status **`scheduled`**, **`scenario: sim_only`**, **`stripePaymentId`** (idempotent per payment/session), **`travelDate`**, **`hasPartnerSim`**, and deduction fields. Paid SIM-only requests are **not** created through **`/api/submit`**.
6. Customer lands on **`/activate/success?session_id=…`**; the UI loads/polls **`GET /api/activate/status`** and shows **Payment Confirmed** plus scheduling copy for the travel date while status remains **`scheduled`**.
7. Admin marks the request **active** when operationally ready (**UC-7**).
8. System sets **`active`**, sends **plan-specific success email**, audit log as today.

**Postconditions** — Request moves **`scheduled` → `active`**; success email **only** after admin **Mark as Active**.

**Related routes** — `/activate/buy-plan`, `/activate/success`, `/api/plans/public`, `/api/stripe/checkout`, `/api/stripe/webhook`, `/api/activate/status`.

---

### UC-2 — Customer: Combo (ICCID + top-up voucher, $0)

| Field | Content |
|-------|---------|
| **Goal** | Customer uses an **activated** **top-up** voucher together with **ICCID**; no payment. |
| **Preconditions** | Voucher **activated**, type **`top_up`**; ICCID 18–22 digits; not redeemed; ICCID not already tied to an activation request. |

**Main success scenario**

1. Client calls **`GET /api/validate`** with **ICCID** and **voucher code**; response scenario **`combo`**, plan price **$0**.
2. Client submits **email**, **`planId`** (matches voucher), **`travelDate`**, and **`iccid`** via **`POST /api/submit`** (`scenario: combo`).
3. System creates **`scheduled`** `ActivationRequest`, marks voucher **redeemed** (`redeemedBy` includes email and ICCID), audit log.

**UI note** — The current customer SPA (**`/activate/redeem`**, **`/activate/buy-plan`**) does **not** collect ICCID. Combo is supported for **API / integrations** (and any future UI) via **`/api/validate`** + **`/api/submit`**.

**Postconditions** — Voucher **redeemed**; single-use enforced.

**Related routes** — `/api/validate`, `/api/submit`, `/activate/success`, `/api/activate/status`.

---

### UC-3 — Customer: Redeem voucher only ($0, physical SIM or eSIM)

| Field | Content |
|-------|---------|
| **Goal** | Customer redeems an **activated** voucher without paying: either **physical SIM top-up** (`voucher_sim`) or **eSIM** (`esim_voucher`). |
| **Preconditions** | Voucher **activated**; type matches chosen path (**`top_up`** → physical voucher flow, **`esim`** → eSIM). |

**Main success scenario**

1. Customer opens **`/activate/redeem`** (`/` may link here; **`/activate`** redirects to **`/activate/redeem`**). User picks **Physical SIM voucher** vs **eSIM voucher**, enters **code**, clicks validate.
2. **`GET /api/validate?voucherCode=…`** returns **`voucher_sim`** or **`esim_voucher`** and the bound **plan** (price **$0** in response).
3. Customer enters **email** and **travel date**, submits **`POST /api/submit`** with **`scenario`** matching validate (`voucher_sim` or `esim_voucher`), matching **`planId`**, and **`travelDate`**.
4. System creates **`scheduled`** request; voucher **redeemed**; redirect to **`/activate/success?scheduled=1&travelDate=…&request_id=…`**.
5. Admin **Mark as Active** may optionally supply **`esimQrPayload`** for **`esim_voucher`**; success email includes plan copy and optional QR (HTML + attachment). Fulfillment remains **manual**.

**Related routes** — `/activate/redeem`, `/api/validate`, `/api/submit`, `/activate/success`, **`POST /api/admin/complete`**, `/api/activate/status`.

---

### UC-4 — Dealer: Unlock single voucher

| Field | Content |
|-------|---------|
| **Goal** | After sale, move one code from **inactive** to **activated**. |
| **Preconditions** | Dealer or admin session; voucher exists and is **inactive**. |

**Main success scenario**

1. User signs in and opens **`/dealer`**.
2. User enters one **voucher code** and confirms **Unlock**.
3. **`POST /api/dealer/unlock`** with `{ code }` sets voucher **activated**, records **`activatedAt`** / **`activatedById`**, and **audit** log.
4. **Recent unlocks** on the same page refreshes (and auto-refreshes on an interval); for filters and full history the user opens **`/dealer/tracking`** (**Open full tracking →**).

**Postconditions** — Customer can pass validation/submit for that code (subject to other rules).

**Related routes** — `/dealer`, `/dealer/tracking`, **`GET` / `POST /api/dealer/unlock`** (GET returns recent-unlock snapshot for the dashboard).

---

### UC-5 — Dealer (or Admin): Bulk unlock vouchers

| Field | Content |
|-------|---------|
| **Goal** | Unlock many codes in one action (e.g. batch sale). |
| **Preconditions** | Authenticated **dealer** or **admin** (same **`/dealer`** UI and **`/api/dealer/unlock`**). |

**Main success scenario**

1. User pastes multiple codes in the bulk field.
2. **`POST /api/dealer/unlock`** with `{ codes: string[] }` unlocks each valid **inactive** code; unknown or already-non-inactive codes increment **skipped**; response returns **`unlocked`** / **`skipped`** counts.
3. User may use **`/dealer/tracking`** to filter unlocked vouchers by date range, plan, type, and used state (**`GET /api/dealer/tracking`**).

---

### UC-6 — Admin: Import vouchers

| Field | Content |
|-------|---------|
| **Goal** | Load new voucher codes linked to plan and type. |

**Main success scenario**

1. Admin opens **`/admin/vouchers`** (Import vouchers).
2. Admin pastes codes (one per line or comma-separated), selects **plan** (from catalog) and **type** (e.g. `top_up` / `esim`).
3. **`POST /api/admin/vouchers/import`** inserts vouchers with status **inactive**.

---

### UC-7 — Admin: Process queue and mark request active

| Field | Content |
|-------|---------|
| **Goal** | Manual fulfillment and customer notification. |

**Main success scenario**

1. Admin opens **queue** **`/admin`**; requests with status **`scheduled`** are listed (ICCID, voucher, email, scenario, plan, amount, **travel date**, checkout adjustments when applicable).
2. UI highlights **Due today** (travel date equals current calendar day) to prioritize morning work.
3. Admin performs external activation with supplier/carrier.
4. Admin clicks **Mark as Active** (for **`esim_voucher`**, may paste **eSIM QR / LPA** for the customer email first).
5. **`POST /api/admin/complete`** sends **plan-specific success email** (SMTP or Resend per env), then sets status **`active`**, **`completedAt`**, **`completedById`**, stores optional **`esimQrPayload`**, and writes **audit** entry.
6. If email transport fails, API may still return **`completed: true`** with **`emailWarning`** so ops knows the row was closed but mail failed.

**Postconditions** — Success email reflects plan metadata from DB; voucher redemption for voucher flows already occurred at submit.

**Related routes** — `/admin`, `/admin/completed` (lists **`active`** rows), `/api/admin/queue`, `/api/admin/complete`.

---

### UC-8 — Admin: Voucher tracking

| Field | Content |
|-------|---------|
| **Goal** | Audit which dealer unlocked a code and who/what redeemed it. |

**Main success scenario**

1. Admin opens **`/admin/vouchers/tracking`**.
2. Admin reviews unlocked-by, redeemed-by, and related fields (per API/UI).

**Related routes** — `/admin/vouchers/tracking`, `/api/admin/vouchers/tracking`.

---

### UC-9 — Plan catalog (data model; no full admin CRUD UI)

| Field | Content |
|-------|---------|
| **Goal** | Maintain plan definitions used by validation, checkout, emails, and voucher import. |

**Reality in codebase** — Plans live in the database (seed/migrations/Prisma Studio). **`GET /api/admin/plans`** returns the catalog for the **Import vouchers** plan dropdown only; there is **no** separate admin screen to create/edit plans in the app. **SIM hardware deduction** amounts for the **Buy plan** and **partner SIM** toggle are configured per market in **`SimHardwareCostByMarket`** (used by **`/api/plans/public`**, **`/api/stripe/checkout`**, and related logic).

---

### UC-10 — Customer: US market eSIM path

| Field | Content |
|-------|---------|
| **Goal** | US residents use **eSIM-only** vouchers (plans seeded with **`market: us`**, **`planType: esim`**). |

**Main success scenario**

1. Customer follows **`/activate/us`** from the home page.
2. Validation uses **`GET /api/validate`** with **`market=us`** and **voucher only** (ICCID is rejected on this path with a dedicated error).
3. Only vouchers whose plan is **US eSIM** pass; others return a clear error directing users to international activation.
4. Customer provides **email** and **travel date**, then submits via **`POST /api/submit`** (`scenario: esim_voucher`) like the international redeem flow.
5. Queue and admin behavior match **UC-3** / **UC-7**; admin **Mark as Active** may attach QR as above.

---

### UC-11 — Localization

| Field | Content |
|-------|---------|
| **Goal** | Public UI in the correct locale; geo-aware default where no cookie is set. |

**Main success scenario**

1. **`src/middleware.ts`** sets **`NEXT_LOCALE`** from Geo-IP headers (`x-vercel-ip-country`, `cf-ipcountry`, `x-country-code`) or **`Accept-Language`** when no valid locale cookie exists (matcher skips **`/api`** and static assets).
2. Customer may override language via the language switcher (cookie).
3. Copy includes headline, options, errors, and **Request Received** text in **EN, FR, JA, NL, ZH, ES, HI** (`src/i18n/messages/*.json`).
4. **Success email** after admin **Mark as Active** is **English** (plan fields dynamic; no locale passed from that API today).

**Related paths** — `src/i18n/messages/*.json`, `src/middleware.ts`, `src/i18n/request.ts`.

---

### UC-12 — Authentication

| Field | Content |
|-------|---------|
| **Goal** | Only **admin** accesses **`/admin/*`**; **admin** and **dealer** access **`/dealer`**. |

**Main success scenario**

1. User opens **`/login`**, enters credentials.
2. NextAuth session created (Prisma adapter).
3. **`admin` layout** allows only role **admin**; **`dealer` layout** allows **admin** or **dealer** (including **`/dealer/tracking`**). APIs enforce the same roles where applicable.

**Related routes** — `/login`, `/api/auth/[...nextauth]`.

---

## 4. Alternative flows and error cases

| ID | Condition | Expected system behavior |
|----|-----------|---------------------------|
| **A-1** | Voucher **inactive** | Message: voucher not yet activated; contact dealer (`/api/validate`, `/api/submit`). |
| **A-2** | Voucher **redeemed** | Reject; code already used. |
| **A-3** | Invalid ICCID / email / body | Validation error; no corrupt submission. ICCID must be **18–22 digits** when provided. |
| **A-4** | **Rate limit** — **3** failed-attempt records per IP (rolling **1 hour**) | **429**; message to try again in 1 hour. Failures that **record** an attempt include invalid ICCID, unknown voucher, inactive/redeemed voucher (on validate), and several **`/api/submit`** failures. The same IP key is used for **`/api/validate`** and **`/api/submit`**. Simple validation errors (e.g. missing ICCID+voucher) may **not** increment the counter. |
| **A-5** | Stripe checkout **cancelled** or payment fails | No **`checkout.session.completed`** path to create a paid request; user returns per Stripe cancel URL. |
| **A-6** | Unauthenticated access to admin/dealer | Redirect to login or **401/403** on APIs. |
| **A-7** | **`market=us`** but ICCID supplied | **400** — US flow is voucher-only for eSIM. |
| **A-8** | Voucher **type** wrong for path | e.g. **eSIM** voucher on **Physical SIM voucher** redeem (or the inverse), **combo** with wrong voucher type, or **US** path with non–US-eSIM plan — **`/api/validate`** returns **400** with explanatory copy. |
| **A-9** | **`POST /api/submit`** voucher **planId** mismatch | **400** — voucher or plan invalid. |
| **A-10** | **ICCID** already has any **`ActivationRequest`** | **409** on **`GET /api/validate`** (when ICCID is sent) and **`POST /api/submit`** (combo). **`/api/validate`** returns **`code: ICCID_ALREADY_USED`**. Default **Buy plan** checkout does **not** send ICCID; if **`metadata.iccid`** is present on a Checkout session, the webhook may dedupe/replace **scheduled** rows for that ICCID and duplicate-ICCID handling may still apply for that integration. |
| **A-11** | **Concurrent** **`POST /api/submit`** with the same **activated** voucher | Transaction **claims** voucher (**`activated` → `redeemed`**) before creating the request; second client gets **409** *This voucher has already been used.* |

---

## 5. Out of scope / known gaps (documented)

| Topic | Note |
|-------|------|
| **Carrier / real-time activation API** | No automatic activation or instant fulfillment; manual queue + admin **Mark as Active**. |
| **Automatic eSIM QR from carrier** | QR in email only if **admin** supplies **`esimQrPayload`** when marking **`esim_voucher`** rows active. |
| **Instant “line is live” in browser** | After payment or voucher submit, the success page shows **scheduled** / **Payment Confirmed** until admin **Mark as Active**; polling **`/api/activate/status`** updates the headline when the row becomes **`active`**. Final email still follows admin action (unless **`emailWarning`**). |
| **WebSockets** | Customer status uses **polling** on **`/activate/success`**, not WebSockets. |
| **Stripe “cryptocurrency” as Checkout PM** | Card (and configured methods) supported; native Checkout crypto may require separate Stripe product — see `doc/feature-verification.md`. |
| **Email transport missing** | If neither SMTP nor Resend is configured, **`sendSuccessEmail`** logs and returns success without sending — see `src/lib/email.ts`. |

---

## 6. Traceability

| Document | Relationship |
|----------|--------------|
| `doc/project description.md` | Business scenarios, copy, localization, manual queue. |
| `doc/instructions.md` | Dealer/voucher lifecycle concepts (portal implements manual fulfillment + unlock/redeem as above). |
| `doc/development-plan.md` | Phased requirements and architecture. |
| `doc/feature-verification.md` | Requirement ↔ implementation checklist. |
| `README.md` | Setup, URLs, env vars, operational notes. |

---

## Document history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | — | Initial use-case catalog for manual QA and handover. |
| 1.1 | 2025-03-22 | Synced with code: validate/submit rules, US path, rate-limit semantics, SIM-only via webhook only, admin complete + optional eSIM QR, plan catalog via API only, email/locale notes. |
| 1.2 | 2025-03-22 | Duplicate prevention: one ICCID per activation queue; transactional voucher claim on submit; Stripe duplicate-ICCID webhook audit. |
| 1.3 | 2026-03-25 | Aligned with product: **`/activate/redeem`** + **`/activate/buy-plan`**, travel date, **`scheduled` / `active`** lifecycle, partner SIM deduction (**`SimHardwareCostByMarket`**), scenarios **`voucher_sim`** + **`esim_voucher`**, dealer **`/dealer/tracking`**, admin **Mark as Active** / **Due today**, status polling on success page; combo documented as API-first without ICCID in current SPA. |
