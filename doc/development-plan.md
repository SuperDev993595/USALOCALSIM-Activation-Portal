# USALOCALSIM Activation Portal — Development Plan

This plan merges the **Master Specification** (project description.md) and **Voucher & Activation Rules** (instructions.md). The core is **manual fulfillment**; voucher lifecycle and dealer features are included as specified in instructions.

---

## Principles

- **Manual-first:** No real-time carrier/eSIM API in scope; every submission goes to an admin queue. Optional automation can be added later.
- **Two-field input:** ICCID (for physical SIM) and Voucher Code (optional/conditional) on the activation page.
- **Three scenarios:** SIM Only (pay via Stripe), Combo (ICCID + voucher → $0), eSIM Voucher (voucher only → $0).
- **Single post-submission message:** "Request Received! Our technical team is now manually activating your USALOCALSIM service. You will receive a confirmation message/email in a few minutes once your line is live."
- **Success email** only after admin clicks **Complete** (or future automation).

---

## Phase 1: Foundation & Setup

| # | Task | Details |
|---|------|--------|
| 1.1 | **Tech stack** | Choose stack (e.g. Next.js/React + Node/API, or similar). Ensure SSR or static export for fast load and SEO. |
| 1.2 | **Repo & environment** | Repo structure, env vars (e.g. `STRIPE_SECRET`, `DATABASE_URL`, `EMAIL_*`). Dev/staging/production configs. |
| 1.3 | **Database** | Schema design: users (admin/dealer), vouchers, plans, activation_requests, audit_logs. Migrations. |
| 1.4 | **Auth (admin/dealer)** | Admin login; separate dealer accounts (for voucher unlock tracking). Session/JWT and role checks. |
| 1.5 | **Hosting & URL** | Deploy so activation portal is reachable at target URL (e.g. activate.usalocalsim.com). HTTPS, minimal 3G/4G payload. |

**Exit:** App runs, DB connected, admin (and optionally dealer) can log in.

---

## Phase 2: Data Model & Config

| # | Task | Details |
|---|------|--------|
| 2.1 | **Plans** | Table/config for data plans: name, data allowance, duration, price, plan_type (physical_sim / esim), market (global / US). |
| 2.2 | **Hardware discount** | Config for SIM cost to deduct for "SIM Only" so checkout shows remaining balance only. |
| 2.3 | **Vouchers** | Table: code (unique), status (inactive / activated / redeemed), plan_id, type (top_up / esim), activated_at, activated_by (dealer_id), redeemed_at, redeemed_by (email or ICCID). |
| 2.4 | **Activation requests** | Table: ICCID (nullable), voucher_code (nullable), email, scenario (sim_only / combo / esim_voucher), plan_id, amount_paid, stripe_payment_id (if any), status (pending / completed), created_at, completed_at, completed_by. |
| 2.5 | **Seed / import** | Way to create plans and load voucher codes (e.g. CSV import) in inactive state. |

**Exit:** All core entities and relationships defined; vouchers and plans manageable.

---

## Phase 3: Customer Activation Portal (Public)

| # | Task | Details |
|---|------|--------|
| 3.1 | **Landing / activation page** | Single page: headline "Activate Your USALOCALSIM Service", sub-headline about manual processing. Two fields: **ICCID**, **Voucher Code** (optional). Clean, minimal UI; no ads; fast on 3G/4G. |
| 3.2 | **Routing logic** | From input, determine scenario: (1) ICCID + voucher → Combo; (2) ICCID only → SIM Only; (3) Voucher only → eSIM Voucher. Validate ICCID format for physical paths; validate voucher exists and is activated (not inactive/redeemed) for voucher paths. |
| 3.3 | **Voucher validation** | If voucher code used: check status. If **inactive** → show "Voucher not yet activated. Please contact your dealer." If **redeemed** → show error (already used). If **activated** → continue. |
| 3.4 | **SIM Only flow** | ICCID → fetch/select plan menu → apply hardware discount → show remaining balance → collect email → redirect to Stripe (card + crypto). |
| 3.5 | **Combo flow** | ICCID + voucher → validate both → ensure voucher is top-up type and matches physical SIM → total $0 → collect email → create activation request → show "Request Received! …" |
| 3.6 | **eSIM Voucher flow** | Voucher only → validate eSIM voucher → total $0 → collect email → create activation request → show "Request Received! …" |
| 3.7 | **Post-submission message** | After any successful submission, show exactly: "Request Received! Our technical team is now manually activating your USALOCALSIM service. You will receive a confirmation message/email in a few minutes once your line is live." |
| 3.8 | **User-facing copy** | Multilingual strings for Option 1 / 2 / 3 (Card+voucher, Card only, eSIM voucher) as in project description. |
| 3.9 | **US market option** | Secondary path or toggle for US residents: eSIM only, plans 30/60/90 days unlimited. Still manual queue; no separate API. |

**Exit:** Customer can complete all three flows; voucher status enforced; message consistent.

---

## Phase 4: Stripe (SIM Only Payment)

| # | Task | Details |
|---|------|--------|
| 4.1 | **Stripe account** | Configure Stripe (test/live): Checkout uses **card** payments per project description. |
| 4.2 | **Checkout** | For SIM Only: create Stripe Checkout Session (or Payment Intent) with correct amount; success/cancel return URLs. |
| 4.3 | **Webhook** | On successful payment: create activation request (status pending), link payment ID, send to admin queue. |
| 4.4 | **Idempotency** | Avoid duplicate activation requests for same payment (idempotency key or id check). |

**Exit:** SIM Only paid via Stripe (card + crypto); payment creates pending request in queue.

---

## Phase 5: Admin Dashboard

| # | Task | Details |
|---|------|--------|
| 5.1 | **Queue view** | List of pending activations: ICCID, Voucher Code, Email, scenario, plan, amount paid, date. Real-time or short-polling refresh. |
| 5.2 | **Filters/search** | Filter by status (pending/completed), date range; search by ICCID, email, voucher code. |
| 5.3 | **Complete action** | "Complete" button per request. On click: set status = completed, set completed_at and completed_by; trigger **Success email** to customer (plan-specific template). Mark voucher as **redeemed** if voucher was used; log redemption (email/ICCID). |
| 5.4 | **Audit** | Log who completed which request and when (for "Logs" requirement). |

**Exit:** Admin sees all pending requests and completes them manually; success email sent only after Complete.

---

## Phase 6: Voucher Lifecycle & Dealer Panel

| # | Task | Details |
|---|------|--------|
| 6.1 | **Dealer auth** | Dealer login (separate from admin); role `dealer` with optional dealer_id for tracking. |
| 6.2 | **Dealer UI (mobile-friendly)** | Simple layout: single unlock (enter voucher code → "Unlock") and bulk unlock (upload/list of codes or batch id). |
| 6.3 | **Single unlock** | Dealer enters code → system sets voucher status = activated, activated_by = dealer_id, activated_at = now. |
| 6.4 | **Bulk activation** | Admin or dealer: select batch (e.g. 100 codes) → "Unlock" whole batch; all set to activated and linked to dealer/admin. |
| 6.5 | **Tracking** | Admin view: which dealer (or admin) activated which voucher; optional report by dealer. |
| 6.6 | **Redeem on use** | When customer submits Combo or eSIM Voucher, set voucher status = redeemed, store email or ICCID and request_id. |

**Exit:** Vouchers move inactive → activated (dealer) → redeemed (customer use); dealers have fast unlock UI.

---

## Phase 7: Security & Resilience

| # | Task | Details |
|---|------|--------|
| 7.1 | **Rate limit (wrong code)** | Per IP (or per session): after 3 failed voucher/validation attempts, block for 1 hour; show clear message. |
| 7.2 | **Audit logs** | Log critical actions: voucher unlock, redemption, admin complete, login failures. Store who, when, device/IP where useful. |
| 7.3 | **Input validation** | Sanitize ICCID and voucher code; prevent injection. Validate email format. |
| 7.4 | **Admin/Dealer security** | Strong passwords, optional 2FA; rate limit login. |

**Exit:** Brute-force protection and traceability in place.

---

## Phase 8: Localization (Geo-IP + 7 Languages)

| # | Task | Details |
|---|------|--------|
| 8.1 | **Language set** | English (primary), French, Japanese, Dutch, Chinese, Spanish, Hindi. |
| 8.2 | **Geo-IP** | Detect country/region on first visit; set default language (e.g. France → French, Japan → Japanese). Allow manual language switcher. |
| 8.3 | **Translations** | All user-facing strings: headline, sub-headline, options 1–3, form labels, errors, "Request Received!", emails (subject + body). |
| 8.4 | **Email language** | Send confirmation/success email in same language as session or user preference if stored. |

**Exit:** Site and key emails localized; default language from Geo-IP.

---

## Phase 9: Plan-Specific Email & Verification

| # | Task | Details |
|---|------|--------|
| 9.1 | **Templates** | One template per plan (or plan type): placeholders for plan name, data allowance, duration. Success email content matches plan. |
| 9.2 | **Verification chain** | Before sending success email: Voucher Code (if any) → plan_id → plan details → ensure email copy matches website package description. |
| 9.3 | **Trigger** | Send only from "Complete" flow (or future automation). No generic one-size-fits-all success email. |
| 9.4 | **Transactional provider** | Configure SMTP or provider (e.g. SendGrid, Resend); test deliverability and spam. |

**Exit:** Success email is plan-specific and consistent with site and voucher.

---

## Phase 10: US Market, Polish & Handover

| # | Task | Details |
|---|------|--------|
| 10.1 | **US eSIM path** | Dedicated entry or flag for US residents: eSIM only, 30/60/90 day unlimited plans; still via manual queue. |
| 10.2 | **Error handling** | Friendly messages for invalid ICCID, invalid/used/inactive voucher, payment failure, network errors. |
| 10.3 | **Testing** | E2E: all three scenarios, voucher inactive/activated/redeemed, Stripe test mode, admin complete → email received. |
| 10.4 | **Docs & handover** | README: setup, env vars, how to run migrations, add plans, import vouchers. Document manual process for ops. |

**Exit:** Feature-complete, tested, and documented for deployment and operations.

---

## Assumptions & Out of Scope (Current Plan)

- **No carrier/eSIM API:** Activation is manual; no "fetch QR in &lt;1 min" or "notify carrier instantly" in this phase. These can be added later as optional automation hooks after admin or system calls external APIs.
- **Supplier validation:** "Supplier's system will naturally reject non-USALOCALSIM" is handled outside this portal (by the team when they activate with the supplier).
- **Dealer assignment:** How dealers get accounts (invite, self-register, or admin-created) is configurable; tracking is required.
- **Payments:** Stripe Checkout with card only (no crypto in scope).

---

## Optional Future Phases

- **Automation hooks:** After "Complete" (or in parallel), call supplier/carrier API to trigger activation; or for eSIM, call QR provider and send email automatically when API succeeds.
- **Customer self-service:** Optional status page where customer enters request ID or email to see "Pending" vs "Completed".
- **Analytics:** Dashboards for redemption rates, revenue, top dealers.

---

## Suggested Order of Implementation

1. **Phase 1** — Foundation  
2. **Phase 2** — Data model  
3. **Phase 3** — Customer portal (without Stripe; Combo and eSIM $0 first)  
4. **Phase 5** — Admin queue + Complete + success email (basic template)  
5. **Phase 4** — Stripe for SIM Only  
6. **Phase 6** — Voucher lifecycle + dealer panel  
7. **Phase 7** — Security  
8. **Phase 8** — Localization  
9. **Phase 9** — Plan-specific email verification  
10. **Phase 10** — US market, polish, handover  

This order gets a minimal end-to-end flow (submit → queue → complete → email) early, then adds payment, dealers, security, and localization.
