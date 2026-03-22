# USALOCALSIM Activation Portal — Use Cases

This document describes **actors**, **primary use cases**, **alternative flows**, and **out-of-scope** behavior for the activation portal. It aligns with `README.md`, `doc/development-plan.md`, and `doc/feature-verification.md`.

---

## 1. System overview

| Item | Description |
|------|-------------|
| **Purpose** | Capture activation requests (ICCID and/or voucher), route **SIM Only** payments through **Stripe**, enqueue all submissions for **manual** fulfillment, and send **success email** only after **Admin Complete**. |
| **Tech context** | Next.js 14 (App Router), MySQL + Prisma, NextAuth (admin/dealer), Stripe Checkout + webhook, next-intl (7 locales). |

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
| **Preconditions** | Valid ICCID; plans in DB; Stripe and env vars configured. |
| **Trigger** | Customer enters ICCID and continues on SIM-only path. |

**Main success scenario**

1. Customer opens public activation flow and provides **ICCID** (no valid combo/eSIM-voucher path).
2. System validates ICCID and classifies scenario as **SIM only**.
3. Customer selects a **plan**; displayed amount reflects `SIM_HARDWARE_COST_CENTS` deduction.
4. Customer provides **email** and is redirected to **Stripe Checkout**.
5. Customer completes payment.
6. **Stripe webhook** creates `ActivationRequest` with status **pending** and links payment (idempotent per payment/session).
7. Customer sees success copy: *Request Received! Our technical team is now manually activating your USALOCALSIM service. You will receive a confirmation message/email in a few minutes once your line is live.*
8. Admin processes the request operationally and clicks **Complete**.
9. System marks request **completed**, sends **plan-specific success email**, and records audit metadata.

**Postconditions** — Request moves `pending` → `completed`; customer receives success email **only** after step 8–9.

**Related routes** — `/activate`, `/activate/plan`, `/activate/checkout`, `/activate/success`, `/api/validate`, `/api/stripe/checkout`, `/api/stripe/webhook`.

---

### UC-2 — Customer: Combo (ICCID + voucher, $0)

| Field | Content |
|-------|---------|
| **Goal** | Customer uses an **activated** top-up voucher with ICCID; no payment. |
| **Preconditions** | Voucher exists, is **activated**, correct type/plan rules for combo; not redeemed. |

**Main success scenario**

1. Customer enters **ICCID** and **voucher code**.
2. System validates; scenario **combo**; total **$0**.
3. Customer submits **email**.
4. System creates **pending** `ActivationRequest` and marks voucher **redeemed** (with redemption attribution per implementation).
5. Customer sees **Request Received** message (same manual-fulfillment copy as spec).
6. Admin **Complete** → success email → completed.

**Postconditions** — Voucher **redeemed**; single-use enforced.

**Related routes** — `/api/validate`, `/api/submit`, `/activate/success`.

---

### UC-3 — Customer: eSIM voucher only ($0)

| Field | Content |
|-------|---------|
| **Goal** | Customer activates using **eSIM voucher** only (no physical ICCID on this path). |
| **Preconditions** | Voucher type **esim**, status **activated**. |

**Main success scenario**

1. Customer enters **voucher code** only (per flow rules).
2. System validates; scenario **eSIM voucher**; **$0**.
3. Customer submits **email**.
4. System creates **pending** request; voucher **redeemed**.
5. **Request Received** message.
6. Admin **Complete** → plan-specific success email.

**Note** — Instant eSIM QR / carrier API is **out of scope**; fulfillment remains manual until admin completes.

---

### UC-4 — Dealer: Unlock single voucher

| Field | Content |
|-------|---------|
| **Goal** | After sale, move one code from **inactive** to **activated**. |
| **Preconditions** | Dealer session; voucher exists and is **inactive**. |

**Main success scenario**

1. Dealer signs in and opens **Dealer** panel.
2. Dealer enters one **voucher code** and confirms **Unlock**.
3. System sets voucher **activated**, records **activatedBy** / **activatedAt** for tracking.

**Postconditions** — Customer can pass validation/submit for that code (subject to other rules).

**Related routes** — `/dealer`, `/api/dealer/unlock`.

---

### UC-5 — Dealer (or Admin): Bulk unlock vouchers

| Field | Content |
|-------|---------|
| **Goal** | Unlock many codes in one action (e.g. batch sale). |
| **Preconditions** | Authenticated **dealer** or **admin** (admin may use dealer UI per README). |

**Main success scenario**

1. User pastes multiple codes (textarea / bulk UI).
2. System unlocks each valid **inactive** code; invalid/duplicate handling per API.
3. Tracking fields updated per voucher.

---

### UC-6 — Admin: Import vouchers

| Field | Content |
|-------|---------|
| **Goal** | Load new voucher codes linked to plan and type. |

**Main success scenario**

1. Admin opens **Import vouchers**.
2. Admin pastes codes (one per line or comma-separated), selects **plan** and **type** (e.g. `top_up` / `esim`).
3. System inserts vouchers with status **inactive**.

**Related routes** — Admin vouchers UI, `/api/admin/vouchers/import`.

---

### UC-7 — Admin: Process queue and complete request

| Field | Content |
|-------|---------|
| **Goal** | Manual fulfillment and customer notification. |

**Main success scenario**

1. Admin opens **queue** (`/admin`); pending requests listed (e.g. ICCID, voucher, email, scenario, plan, amount, date; refresh as implemented).
2. Admin performs external activation with supplier/carrier.
3. Admin clicks **Complete** on the request.
4. System sets status **completed**, timestamps and **completedBy**, sends **plan-specific success email** from DB plan data, writes **audit** entry.

**Postconditions** — Success email reflects same plan metadata as site; voucher redemption for voucher flows already occurred at submit.

**Related routes** — `/admin`, `/admin/completed`, `/api/admin/complete`.

---

### UC-8 — Admin: Voucher tracking

| Field | Content |
|-------|---------|
| **Goal** | Audit which dealer unlocked a code and who/what redeemed it. |

**Main success scenario**

1. Admin opens **voucher tracking** view.
2. Admin reviews unlocked-by, redeemed-by, and related fields.

**Related routes** — `/admin/vouchers/tracking`, `/api/admin/vouchers/tracking`.

---

### UC-9 — Admin: Manage plans (if exposed)

| Field | Content |
|-------|---------|
| **Goal** | Maintain plan catalog used by checkout and emails. |

**Main success scenario** — Per `/api/admin/plans` and admin UI if present: create/update plans so SIM Only, combo, and eSIM flows stay consistent.

---

### UC-10 — Customer: US market eSIM path

| Field | Content |
|-------|---------|
| **Goal** | US residents use **eSIM-only** plans (e.g. 30 / 60 / 90 day unlimited from seed). |

**Main success scenario**

1. Customer follows **US residents: eSIM only** entry from landing.
2. Customer completes flow consistent with **eSIM voucher** or US plan selection per UI.
3. Request enters queue; admin **Complete** sends email.

---

### UC-11 — Localization

| Field | Content |
|-------|---------|
| **Goal** | UI (and email behavior as implemented) in the correct locale. |

**Main success scenario**

1. **System** resolves locale from cookie, `Accept-Language`, and/or Geo-IP headers (`x-vercel-ip-country`, `cf-ipcountry`, `x-country-code`) in middleware.
2. Customer may override language via language switcher.
3. Copy includes headline, options, errors, and **Request Received** text in **EN, FR, JA, NL, ZH, ES, HI**.

**Related paths** — `src/i18n/messages/*.json`, `src/middleware.ts`.

---

### UC-12 — Authentication

| Field | Content |
|-------|---------|
| **Goal** | Only **admin** accesses `/admin`; **admin** and **dealer** access `/dealer`. |

**Main success scenario**

1. User opens `/login`, enters credentials.
2. NextAuth session created (DB session adapter).
3. Role-based access enforced on admin/dealer layouts and APIs.

**Related routes** — `/login`, `/api/auth/[...nextauth]`.

---

## 4. Alternative flows and error cases

| ID | Condition | Expected system behavior |
|----|-----------|---------------------------|
| **A-1** | Voucher **inactive** | Message: voucher not yet activated; contact dealer (`/api/validate`, `/api/submit`). |
| **A-2** | Voucher **redeemed** | Reject; code already used. |
| **A-3** | Invalid ICCID / email / input | Validation error; no corrupt submission. |
| **A-4** | **Rate limit** — 3 failed attempts per IP | **429**; block ~1 hour (`RateLimitBlock`). |
| **A-5** | Stripe checkout **cancelled** or payment fails | No successful webhook path to create paid request; user returns per cancel URL behavior. |
| **A-6** | Unauthenticated access to admin/dealer | Deny or redirect to login. |

---

## 5. Out of scope / known gaps (documented)

| Topic | Note |
|-------|------|
| **Carrier / eSIM API** | No automatic activation or instant QR delivery; manual queue + admin Complete. |
| **“Success! Line is live” in browser** | Spec uses **Request Received** until fulfillment; final **success** is email after Complete. |
| **Stripe “cryptocurrency” as Checkout PM** | Card (and configured methods) supported; native Checkout crypto may require separate Stripe product — see `doc/feature-verification.md`. |

---

## 6. Traceability

| Document | Relationship |
|----------|----------------|
| `doc/development-plan.md` | Phased requirements and architecture. |
| `doc/feature-verification.md` | Requirement ↔ implementation checklist. |
| `README.md` | Setup, URLs, env vars, operational notes. |

---

## Document history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | — | Initial use-case catalog for manual QA and handover. |
