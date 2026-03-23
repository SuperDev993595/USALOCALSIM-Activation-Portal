# USALOCALSIM Activation Portal — Use Cases

This document describes **actors**, **primary use cases**, **alternative flows**, and **out-of-scope** behavior for the activation portal. It aligns with `README.md`, `doc/project description.md`, `doc/development-plan.md`, and `doc/feature-verification.md`.

---

## 1. System overview

| Item | Description |
|------|-------------|
| **Purpose** | Capture activation requests (ICCID and/or voucher), route **SIM Only** payments through **Stripe**, enqueue all submissions for **manual** fulfillment, and send **success email** only after **Admin Complete**. |
| **Tech context** | Next.js 14 (App Router), MySQL + Prisma, NextAuth (admin/dealer), Stripe Checkout + webhook, next-intl (7 locales), Nodemailer and/or Resend for email. |

---

## 2. Actors

| Actor | Description |
|-------|-------------|
| **Customer** | End user submitting activation on the public site. |
| **Dealer** | Authenticated user who **unlocks** voucher codes after sale (`inactive` → `activated`). |
| **Admin** | Authenticated user who imports vouchers, views queue, completes requests, and views tracking. |
| **System** | Validates input, enforces voucher lifecycle, rate limits, Stripe integration, emails, persistence, audit logs. |

---

## 3. Primary use cases

### UC-1 — Customer: SIM Only (ICCID, pay via Stripe)

| Field | Content |
|-------|---------|
| **Goal** | Customer with physical SIM pays plan price minus hardware discount. |
| **Actors** | Customer, System, Stripe, Admin (later). |
| **Preconditions** | Valid ICCID; `physical_sim` / `global` plans in DB; Stripe and env vars configured. |
| **Trigger** | Customer opens **`/activate`**, enters ICCID only (no voucher), and continues the SIM-only path. |

**Main success scenario**

1. Customer opens **`/`** or **`/activate`** and provides **ICCID** (no valid combo/eSIM-voucher path).
2. **`GET /api/validate`** validates ICCID and returns scenario **`sim_only`** with discounted plan list (`SIM_HARDWARE_COST_CENTS` applied).
3. Customer selects a **plan** on **`/activate/plan`**, enters **email** on **`/activate/checkout`**, and is redirected to **Stripe Checkout** via **`POST /api/stripe/checkout`**.
4. Customer completes payment.
5. **`POST /api/stripe/webhook`** (`checkout.session.completed`) creates **`ActivationRequest`** with status **pending**, **`scenario: sim_only`**, and **`stripePaymentId`** (idempotent per payment/session). SIM-only requests are **not** created through **`/api/submit`**.
6. Customer lands on **`/activate/success`** and sees: *Request Received! Our technical team is now manually activating your USALOCALSIM service. You will receive a confirmation message/email in a few minutes once your line is live.*
7. Admin processes the request operationally and clicks **Complete**.
8. System marks request **completed**, sends **plan-specific success email**, and records audit metadata.

**Postconditions** — Request moves `pending` → `completed`; customer receives success email **only** after admin complete.

**Related routes** — `/`, `/activate`, `/activate/plan`, `/activate/checkout`, `/activate/success`, `/api/validate`, `/api/stripe/checkout`, `/api/stripe/webhook`.

---

### UC-2 — Customer: Combo (ICCID + voucher, $0)

| Field | Content |
|-------|---------|
| **Goal** | Customer uses an **activated** top-up voucher with ICCID; no payment. |
| **Preconditions** | Voucher exists, is **activated**, type **`top_up`** (not eSIM-only); ICCID 18–22 digits; not redeemed. |

**Main success scenario**

1. Customer enters **ICCID** and **voucher code**; **`GET /api/validate`** returns scenario **combo** and plan (price **$0**).
2. Customer submits **email** and **`planId`** that **matches** the voucher’s plan via **`POST /api/submit`** (`scenario: combo`).
3. System creates **pending** `ActivationRequest`, marks voucher **redeemed** (`redeemedBy` includes email and ICCID for combo), and writes **audit** log.
4. Customer sees **Request Received** message (same manual-fulfillment copy as spec).
5. Admin **Complete** → success email → completed.

**Postconditions** — Voucher **redeemed**; single-use enforced.

**Related routes** — `/api/validate`, `/api/submit`, `/activate/success`.

---

### UC-3 — Customer: eSIM voucher only ($0)

| Field | Content |
|-------|---------|
| **Goal** | Customer activates using **eSIM voucher** only (no physical ICCID on this path). |
| **Preconditions** | Voucher type **`esim`**, status **activated**. |

**Main success scenario**

1. Customer enters **voucher code** only; **`GET /api/validate`** returns **`esim_voucher`** and plan.
2. Customer submits **email** and matching **`planId`** via **`POST /api/submit`**.
3. System creates **pending** request; voucher **redeemed** (`redeemedBy` email).
4. **Request Received** message.
5. Admin **Complete** may optionally supply **`esimQrPayload`**; success email includes **plan-specific** copy and, when payload is valid, **QR image** (HTML + attachment). Fulfillment remains **manual** (no automatic carrier QR fetch).

**Related routes** — `/api/validate`, `/api/submit`, `/activate/success`, **`POST /api/admin/complete`**.

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

**Postconditions** — Customer can pass validation/submit for that code (subject to other rules).

---

### UC-5 — Dealer (or Admin): Bulk unlock vouchers

| Field | Content |
|-------|---------|
| **Goal** | Unlock many codes in one action (e.g. batch sale). |
| **Preconditions** | Authenticated **dealer** or **admin** (same **`/dealer`** UI and **`/api/dealer/unlock`**). |

**Main success scenario**

1. User pastes multiple codes in the bulk field.
2. **`POST /api/dealer/unlock`** with `{ codes: string[] }` unlocks each valid **inactive** code; unknown or already-non-inactive codes increment **skipped**; response returns **`unlocked`** / **`skipped`** counts.

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

### UC-7 — Admin: Process queue and complete request

| Field | Content |
|-------|---------|
| **Goal** | Manual fulfillment and customer notification. |

**Main success scenario**

1. Admin opens **queue** **`/admin`**; pending requests listed (ICCID, voucher, email, scenario, plan, amount, date per UI/API).
2. Admin performs external activation with supplier/carrier.
3. Admin clicks **Complete** on the request (for **`esim_voucher`**, may paste **eSIM QR payload** for the customer email).
4. **`POST /api/admin/complete`** sends **plan-specific success email** (SMTP or Resend per env), then sets status **completed**, **`completedAt`**, **`completedById`**, stores optional **`esimQrPayload`**, and writes **audit** entry.
5. If email transport fails, API may still return **`completed: true`** with **`emailWarning`** so ops knows the row was closed but mail failed.

**Postconditions** — Success email reflects plan metadata from DB; voucher redemption for voucher flows already occurred at submit.

**Related routes** — `/admin`, `/admin/completed`, `/api/admin/queue`, `/api/admin/complete`.

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

**Reality in codebase** — Plans live in the database (seed/migrations/Prisma Studio). **`GET /api/admin/plans`** returns the catalog for the **Import vouchers** plan dropdown only; there is **no** separate admin screen to create/edit plans in the app.

---

### UC-10 — Customer: US market eSIM path

| Field | Content |
|-------|---------|
| **Goal** | US residents use **eSIM-only** vouchers (plans seeded with **`market: us`**, **`planType: esim`**). |

**Main success scenario**

1. Customer follows **`/activate/us`** from the home page.
2. Validation uses **`GET /api/validate`** with **`market=us`** and **voucher only** (ICCID is rejected on this path with a dedicated error).
3. Only vouchers whose plan is **US eSIM** pass; others return a clear error directing users to international activation.
4. Submit and queue behavior matches **UC-3**; admin **Complete** may attach QR as above.

---

### UC-11 — Localization

| Field | Content |
|-------|---------|
| **Goal** | Public UI in the correct locale; geo-aware default where no cookie is set. |

**Main success scenario**

1. **`src/middleware.ts`** sets **`NEXT_LOCALE`** from Geo-IP headers (`x-vercel-ip-country`, `cf-ipcountry`, `x-country-code`) or **`Accept-Language`** when no valid locale cookie exists (matcher skips **`/api`** and static assets).
2. Customer may override language via the language switcher (cookie).
3. Copy includes headline, options, errors, and **Request Received** text in **EN, FR, JA, NL, ZH, ES, HI** (`src/i18n/messages/*.json`).
4. **Success email** after admin complete is **English** (plan fields dynamic; no locale passed from complete flow today).

**Related paths** — `src/i18n/messages/*.json`, `src/middleware.ts`, `src/i18n/request.ts`.

---

### UC-12 — Authentication

| Field | Content |
|-------|---------|
| **Goal** | Only **admin** accesses **`/admin/*`**; **admin** and **dealer** access **`/dealer`**. |

**Main success scenario**

1. User opens **`/login`**, enters credentials.
2. NextAuth session created (Prisma adapter).
3. **`admin` layout** allows only role **admin**; **`dealer` layout** allows **admin** or **dealer**. APIs enforce the same roles where applicable.

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
| **A-8** | Voucher **type** wrong for path | e.g. **top_up** without ICCID, or **esim** when combo expected — **`/api/validate`** returns **400** with explanatory copy. |
| **A-9** | **`POST /api/submit`** voucher **planId** mismatch | **400** — voucher or plan invalid. |

---

## 5. Out of scope / known gaps (documented)

| Topic | Note |
|-------|------|
| **Carrier / real-time activation API** | No automatic activation or instant fulfillment; manual queue + admin **Complete**. |
| **Automatic eSIM QR from carrier** | QR in email only if **admin** supplies **`esimQrPayload`** on complete. |
| **“Success! Line is live” in browser** | Spec uses **Request Received** until fulfillment; final **success** is email after **Complete** (unless email fails — see **`emailWarning`**). |
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
