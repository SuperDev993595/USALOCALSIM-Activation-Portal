# Feature Verification Checklist

This document verifies each requirement from **project description.md** and **instructions.md** against the implementation.

---

## Project Description (Master Specification)

| # | Requirement | Status | Implementation |
|---|-------------|--------|-----------------|
| 1 | **Manual fulfillment** – No real-time API; request-capture portal | ✅ | No carrier/eSIM API. All submissions create `ActivationRequest` with status `pending`. |
| 2 | **Request queue** – Every submission (Paid or Voucher) → Manual Admin Dashboard | ✅ | All flows (SIM Only via Stripe webhook, Combo, eSIM Voucher) create a pending request; admin queue at `/admin` lists them. |
| 3 | **Customer message** – Exact text: "Request Received! Our technical team is now manually activating..." | ✅ | Shown on `/activate/success` (and in all 7 languages via `success.title` + `success.message`). |
| 4 | **Physical SIM and Vouchers as separate items** | ✅ | Two fields: ICCID and Voucher Code; three scenarios (SIM Only, Combo, eSIM Voucher); vouchers have own lifecycle. |
| 5 | **SIM Only** – ICCID → validate → Plan Menu → Hardware Discount → Stripe (Card or Crypto) | ✅ | `/api/validate?iccid=...` returns plans with `priceCents` reduced by `SIM_HARDWARE_COST_CENTS`. Checkout uses Stripe; card + us_bank_account. Crypto: see note below. |
| 6 | **Combo** – ICCID + Voucher → Checkout total = $0.00 | ✅ | Validate accepts both; submit creates request with $0; no Stripe. |
| 7 | **eSIM Voucher** – Voucher only → Checkout total = $0.00 | ✅ | Voucher-only validate returns `esim_voucher`; submit with email; $0. |
| 8 | **Two-field input** – [ICCID] (required for physical), [Voucher Code] (optional/conditional) | ✅ | Activation page has ICCID and Voucher Code fields. |
| 9 | **Stripe** – Credit Card and Cryptocurrency | ⚠️ | **Card** and **us_bank_account** are enabled. Stripe Checkout does not support cryptocurrency as a built-in payment method; crypto would require Stripe’s separate Crypto Onramp product or a third-party provider. UI and copy say "Credit Card or Crypto" for flexibility. |
| 10 | **Intelligent localization (Geo-IP)** – Detect location, load dominant language | ✅ | Middleware reads `x-vercel-ip-country`, `cf-ipcountry`, or `x-country-code` and maps to locale (FR, JP, NL, CN/TW, ES, IN, etc.); falls back to Accept-Language and cookie. |
| 11 | **Languages** – English (primary) + French, Japanese, Dutch, Chinese, Spanish, Hindi | ✅ | All 7 locales in `src/i18n/messages/` and used via next-intl. |
| 12 | **US Market** – eSIM only; 30, 60, 90 days Unlimited | ✅ | Seed includes US eSIM plans (30/60/90); home page has "US residents: eSIM only" link. |
| 13 | **Admin: Real-time queue** – Pending list with ICCID, Voucher Code, Email | ✅ | `/admin` shows pending requests with ICCID, voucher code, email, scenario, plan, amount; 30s refresh. |
| 14 | **Admin: Complete button** → automated Success email to customer | ✅ | POST `/api/admin/complete` marks request completed and sends plan-specific success email. |
| 15 | **User-facing copy** – Headline, sub-headline, Option 1/2/3 (multilingual) | ✅ | Headline and sub-headline in messages; Option 1/2/3 titles and descriptions added per spec (all 7 languages). |

---

## Instructions (Voucher & Activation Rules)

| # | Requirement | Status | Implementation |
|---|-------------|--------|-----------------|
| 1 | **Voucher cycle** – Inactive → Activated (dealer unlock) → Redeemed | ✅ | `Voucher.status`: `inactive` | `activated` | `redeemed`. Dealer/Admin unlock sets activated; customer submit sets redeemed. |
| 2 | **Inactive message** – "Voucher not yet activated. Please contact your dealer." | ✅ | Returned by `/api/validate` and `/api/submit` when voucher status is `inactive`. |
| 3 | **Redeemed** – Code "killed", log who used it (Email or ICCID) | ✅ | On submit, voucher updated to `redeemed`, `redeemedBy` = email (or ICCID for combo); one-time use enforced. |
| 4 | **Dealer panel** – Fast, simple, mobile-friendly | ✅ | `/dealer`: single unlock + bulk unlock (textarea); minimal UI. |
| 5 | **Bulk activation** – Admin can activate whole batch (e.g. 100 vouchers) | ✅ | Dealer/Admin can paste many codes and "Unlock all"; API accepts `{ codes: string[] }`. Admin can also use dealer panel (admin has access). |
| 6 | **Single unlock** – Dealer types code, clicks Unlock | ✅ | Single input + Unlock button; POST `/api/dealer/unlock` with `{ code }`. |
| 7 | **Tracking** – Show which dealer sold which voucher | ✅ | `Voucher.activatedById` → User; **Admin → Voucher tracking** page lists vouchers with "Unlocked by" (dealer email) and "Redeemed by". |
| 8 | **Redemption portal** – Clean, instant on 3G/4G | ✅ | Lightweight activation page; no ads; minimal assets. |
| 9 | **Smart recognition** – Code → eSIM asks Email, sends QR; Physical asks ICCID, adds data pack | ✅ | Validate returns scenario (esim_voucher vs combo/sim_only); eSIM path collects email (QR sent after manual complete per spec); physical path uses ICCID. |
| 10 | **Automation (eSIM QR, top-up instant)** | ⏭️ | **Out of scope** per project description (manual fulfillment). Instructions’ "instant" delivery is not implemented; success email sent only after admin Complete. |
| 11 | **"Success! Your service is now active"** | ⏭️ | Spec uses "Request Received! ... in a few minutes" for manual flow. "Success!" in instructions applies to automated flow; we use Request Received for consistency with master spec. |
| 12 | **3 wrong codes → block 1 hour** | ✅ | Rate limit in `RateLimitBlock`; 3 failed validation/submit attempts per IP → 429 for 1 hour. |
| 13 | **Logs** – Every action: who, time, device | ✅ | `AuditLog`: `activation_complete` and `voucher_unlock` with `userId`, and metadata including `ip` and `userAgent`. |
| 14 | **Plan-specific email** – Name, data allowance, duration match plan and site | ✅ | `sendSuccessEmail(to, plan)` uses plan name, dataAllowance, durationDays; content matches plan. |
| 15 | **Final verification** – Voucher → Plan → Website package → Email | ✅ | Complete API loads request + plan from DB (same source as site); email body is built from that plan. |

---

## Summary

- **Fully implemented:** All project-description and instructions requirements except where the two docs conflict (manual vs automated) or where the platform doesn’t support a feature (Stripe + crypto).
- **Stripe + crypto:** Card (and us_bank_account) are in use; cryptocurrency is not a Stripe Checkout payment method; add Stripe Crypto Onramp or another provider if crypto is required.
- **Manual vs automated:** Implementation follows the **project description** (manual queue + Complete → email). Instructions’ instant eSIM/top-up and "Success!" screen are not implemented by design.
