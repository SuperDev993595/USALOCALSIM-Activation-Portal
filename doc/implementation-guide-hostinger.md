# Full Implementation Guide — Hostinger Business

This guide describes how to implement the USALOCALSIM Activation Portal **end-to-end** using a tech stack that runs on **Hostinger Business** (Node.js Web Apps + MySQL).

---

## 1. Why This Stack Fits Hostinger Business

| Hostinger Business feature | How we use it |
|----------------------------|----------------|
| **Node.js 18/20/22/24** | Next.js runs on Node; use **Node 20 LTS**. |
| **Next.js support** | Official support; deploy via GitHub → build → `npm run start -p $PORT`. |
| **MySQL** | One database for users, vouchers, plans, activation_requests, audit_logs. Use Hostinger’s MySQL from hPanel. |
| **Cron jobs** | Optional: cleanup old sessions, send reminder emails; not required for MVP. |
| **SSL & CDN** | Managed SSL; enable CDN in hPanel for static assets. |
| **Email** | PHP mail is limited; use **SMTP** (Hostinger Business SMTP or a transactional provider like Resend/SendGrid) via Nodemailer. |
| **No Redis** | Use MySQL for sessions and rate-limit storage (or in-memory with DB fallback). |

---

## 2. Recommended Tech Stack

| Layer | Choice | Notes |
|-------|--------|--------|
| **Framework** | Next.js 14 (App Router) | SSR for fast first load, API routes, single codebase for portal + admin + dealer. |
| **Language** | TypeScript | Type safety, better refactors. |
| **Database** | MySQL 8 | Hostinger Business includes MySQL. |
| **ORM** | Prisma | Migrations, type-safe queries, works well with MySQL. |
| **Auth** | NextAuth.js (Credentials + session in DB) | Admin and dealer login; session stored in MySQL. |
| **Payments** | Stripe (Node SDK) | Checkout Session for SIM Only; webhooks for completion. |
| **Email** | Nodemailer + SMTP or Resend | Plan-specific templates; use Resend if you want simpler API and better deliverability. |
| **i18n** | next-intl | Geo-IP default locale; 7 languages (EN, FR, JA, NL, ZH, ES, HI). |
| **UI** | Tailwind CSS + simple components | Lightweight, no heavy ads; fast on 3G/4G. |
| **Rate limiting** | In-DB or in-memory | 3 wrong voucher/validation attempts → block 1 hour (store in MySQL or memory). |

---

## 3. Project Structure

```
usalocalsim-activation-portal/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Public activation landing
│   │   ├── activate/
│   │   │   ├── page.tsx                # Activation form (ICCID + Voucher)
│   │   │   ├── plan/page.tsx           # SIM Only: plan selection
│   │   │   ├── checkout/page.tsx       # SIM Only: Stripe redirect
│   │   │   └── success/page.tsx        # "Request Received!" message
│   │   ├── api/
│   │   │   ├── validate/route.ts       # Validate ICCID/voucher, return scenario
│   │   │   ├── submit/route.ts         # Submit Combo or eSIM (no payment)
│   │   │   ├── stripe/
│   │   │   │   ├── checkout/route.ts   # Create Checkout Session
│   │   │   └── webhook/route.ts        # Stripe webhook → create activation request
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── api/auth/[...nextauth]/route.ts
│   │   ├── admin/
│   │   │   ├── layout.tsx              # Admin layout + guard
│   │   │   ├── page.tsx                # Queue (pending list)
│   │   │   ├── completed/page.tsx      # Completed list
│   │   │   └── api/complete/route.ts   # POST → complete request, send email
│   │   ├── dealer/
│   │   │   ├── layout.tsx              # Dealer layout + guard
│   │   │   ├── page.tsx                # Unlock (single + bulk)
│   │   │   └── api/unlock/route.ts
│   │   └── [locale]/
│   │       └── ...                     # Optional locale segment for i18n
│   ├── components/
│   │   ├── ActivationForm.tsx
│   │   ├── PlanSelector.tsx
│   │   ├── admin/
│   │   └── dealer/
│   ├── lib/
│   │   ├── db.ts                       # Prisma client
│   │   ├── auth.ts                     # NextAuth config
│   │   ├── stripe.ts
│   │   ├── email.ts                    # Send plan-specific email
│   │   ├── rate-limit.ts               # 3 strikes → 1hr block
│   │   ├── geo.ts                      # Geo-IP default locale
│   │   └── i18n/
│   │       ├── request.ts
│   │       └── messages/
│   │           ├── en.json
│   │           ├── fr.json
│   │           └── ...
│   └── types/
├── public/
├── .env.example
├── next.config.js
├── package.json
└── README.md
```

---

## 4. Key Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@prisma/client": "^5.x",
    "next-auth": "^4.x",
    "stripe": "^14.x",
    "nodemailer": "^6.x",
    "resend": "^3.x",
    "next-intl": "^3.x",
    "@vercel/og": "optional",
    "zod": "^3.x",
    "bcryptjs": "^2.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/nodemailer": "^6.x",
    "tailwindcss": "^3.x",
    "eslint": "^8.x"
  }
}
```

Use **Resend** OR **Nodemailer** for email, not both. Resend is easier; Nodemailer works with any SMTP (e.g. Hostinger SMTP).

---

## 5. Environment Variables (.env.example)

```env
# Database (Hostinger MySQL from hPanel)
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"

# NextAuth
NEXTAUTH_URL="https://activate.usalocalsim.com"
NEXTAUTH_SECRET="generate-a-long-random-secret"

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Email (choose one approach)
# Option A: Resend
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# Option B: SMTP (e.g. Hostinger)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_USER="..."
SMTP_PASS="..."
EMAIL_FROM="noreply@yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="https://activate.usalocalsim.com"
SIM_HARDWARE_COST_CENTS=999
```

---

## 6. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      String   // "admin" | "dealer"
  name      String?
  dealerId  String?  // for tracking which dealer unlocked which voucher
  createdAt DateTime @default(now())
  sessions  Session[]
  vouchersActivated Voucher[] @relation("ActivatedBy")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expires   DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Plan {
  id            String   @id @default(cuid())
  name          String
  dataAllowance String   // e.g. "Unlimited", "5GB"
  durationDays  Int
  priceCents    Int
  planType      String   // "physical_sim" | "esim"
  market        String   // "global" | "us"
  createdAt     DateTime @default(now())
  vouchers      Voucher[]
  activationRequests ActivationRequest[]
}

model Voucher {
  id           String   @id @default(cuid())
  code         String   @unique
  status       String   // "inactive" | "activated" | "redeemed"
  type         String   // "top_up" | "esim"
  planId       String
  plan         Plan     @relation(fields: [planId], references: [id])
  activatedAt  DateTime?
  activatedById String?
  activatedBy  User?    @relation("ActivatedBy", fields: [activatedById], references: [id])
  redeemedAt   DateTime?
  redeemedBy   String?   // email or ICCID
  activationRequestId String?
  createdAt    DateTime @default(now())
  activationRequests   ActivationRequest[]
}

model ActivationRequest {
  id              String   @id @default(cuid())
  iccid           String?
  voucherCode     String?
  email           String
  scenario        String   // "sim_only" | "combo" | "esim_voucher"
  planId          String
  plan            Plan     @relation(fields: [planId], references: [id])
  amountPaidCents Int      @default(0)
  stripePaymentId String?
  status          String   // "pending" | "completed"
  completedAt     DateTime?
  completedById   String?
  createdAt       DateTime @default(now())
  voucher         Voucher?
}

model AuditLog {
  id        String   @id @default(cuid())
  action    String
  userId    String?
  metadata  String?  // JSON: ip, userAgent, resourceId
  createdAt DateTime @default(now())
}

model RateLimitBlock {
  id        String   @id @default(cuid())
  key       String   // e.g. ip:123.45.67.89
  blockedUntil DateTime
  createdAt DateTime @default(now())
  @@index([key, blockedUntil])
}
```

Run `npx prisma migrate dev` locally; for Hostinger, run migrations via a one-off script or deploy step that calls `prisma migrate deploy`.

---

## 7. Implementation Order (Step-by-Step)

Follow the development plan phases with these concrete steps.

### Phase 1 — Foundation

1. **Scaffold Next.js 14 (App Router) + TypeScript**
   - `npx create-next-app@14 . --typescript --tailwind --app --no-src-dir` then move to `src/` if you prefer the structure above.
2. **Add Prisma**
   - `npx prisma init`
   - Set `datasource` to `mysql` and paste the schema above into `prisma/schema.prisma`.
3. **Create MySQL DB on Hostinger**
   - hPanel → Databases → Create; note host, user, password, database name.
   - Set `DATABASE_URL` locally and in Hostinger env.
4. **Run migrations**
   - `npx prisma migrate dev --name init`
5. **NextAuth with Credentials**
   - Install `next-auth`; create `src/app/api/auth/[...nextauth]/route.ts` and `src/lib/auth.ts`.
   - Use Credentials provider; compare password with bcrypt hash stored in `User`.
   - Use database session adapter (Prisma adapter for NextAuth) so sessions live in MySQL.
6. **Seed one admin user**
   - Prisma seed script: create one `User` with role `admin` and hashed password.

### Phase 2 — Data & Config

1. **Seed plans**
   - Seed script or admin UI to insert `Plan` rows (global physical_sim, esim, and US 30/60/90).
2. **Hardware discount**
   - Store `SIM_HARDWARE_COST_CENTS` in env; use in SIM Only flow when computing remaining balance.
3. **Voucher import**
   - Admin API or simple page: accept CSV of codes, create `Voucher` rows with status `inactive`, link to `planId`.

### Phase 3 — Customer Portal

1. **Landing page** (`src/app/page.tsx`)
   - Headline, sub-headline, two inputs (ICCID, Voucher Code), CTA "Continue".
   - Use `next-intl` for all copy; detect locale from Geo-IP in middleware or server component.
2. **API: validate** (`/api/validate`)
   - Input: ICCID (optional), voucherCode (optional). Validate format; if voucher present, check exists and status (inactive → 403 with "Voucher not yet activated...", redeemed → 409). Return scenario and plan info.
3. **Rate limit**
   - In validate/submit: check `RateLimitBlock` by IP; if 3 failed attempts, insert block for 1 hour; return 429.
4. **Activation form flow**
   - If Combo or eSIM: collect email → POST `/api/submit` → create `ActivationRequest`, mark voucher redeemed if applicable → redirect to `/activate/success`.
   - If SIM Only: redirect to `/activate/plan` with ICCID.
5. **Plan selection** (`/activate/plan`)
   - List plans (filter by market if US); show price minus hardware discount; collect email; create Stripe Checkout Session → redirect to Stripe.
6. **Success page** (`/activate/success`)
   - Show exact message: "Request Received! Our technical team is now manually activating..."
7. **Stripe webhook** (`/api/stripe/webhook`)
   - On `checkout.session.completed`: create `ActivationRequest` (scenario `sim_only`, status `pending`), link `stripePaymentId`. Idempotency by `stripePaymentId` or `session.id`.

### Phase 4 — Stripe (SIM Only)

1. **Checkout Session**
   - `/api/stripe/checkout`: create Session with line item (plan price minus hardware cost), success/cancel URLs, customer email from form.
2. **Success/cancel URLs**
   - Success: redirect to `/activate/success` (same "Request Received!" message).
   - Cancel: back to plan page or activation form.

### Phase 5 — Admin Dashboard

1. **Queue page** (`/admin`)
   - Protected by NextAuth (role admin). List `ActivationRequest` where status = pending; show ICCID, voucher code, email, scenario, plan, amount, date. Refresh every 30s or on focus.
2. **Complete API** (`/admin/api/complete`)
   - POST with request id; set status = completed, completedAt, completedById; if voucher was used, ensure voucher.redeemedAt/redeemedBy already set (or set here); send plan-specific success email; write AuditLog.
3. **Completed tab** (`/admin/completed`)
   - List completed requests with filters.

### Phase 6 — Dealer Panel

1. **Dealer auth**
   - Same NextAuth; users with role `dealer` can access `/dealer`. Restrict admin routes to admin, dealer routes to dealer.
2. **Unlock page** (`/dealer`)
   - Single: input voucher code → POST `/dealer/api/unlock` (body: `{ code }`) → set voucher status = activated, activatedById = session user.
   - Bulk: textarea or file upload of codes → same API with array → unlock all (valid codes only).
3. **Tracking**
   - Admin view: list vouchers with activatedBy (dealer email/id); optional export.

### Phase 7 — Security

1. **Rate limit**
   - Implement in `/api/validate` and `/api/submit`: count failures by IP in DB or memory; after 3, insert `RateLimitBlock` for 1 hour; reject with 429 and message.
2. **Audit log**
   - Log: voucher unlock, redemption, admin complete, login failure (optional). Store in `AuditLog` with action, userId, metadata (IP, userAgent).
3. **Input validation**
   - Use Zod on all API bodies; sanitize ICCID and voucher code; validate email format.

### Phase 8 — Localization

1. **next-intl**
   - Configure with locales: en, fr, ja, nl, zh, es, hi. Middleware: get locale from cookie or Accept-Language or Geo-IP; set locale.
2. **Geo-IP**
   - Use a simple API (e.g. free GeoIP or Hostinger’s headers if they provide country) in middleware to set default locale.
3. **Translate**
   - All portal strings (headline, options 1–3, errors, "Request Received!") and email templates in each locale.

### Phase 9 — Plan-Specific Email

1. **Templates**
   - One template per plan (or per plan type): subject + body with placeholders (planName, dataAllowance, durationDays). Store in code or DB.
2. **Send on Complete**
   - In admin complete API: load plan → pick template → verify copy matches plan → send via Resend or Nodemailer in user’s language if stored.
3. **Verification**
   - Before send: voucher (if any) → plan → plan details; ensure email text matches site package description.

### Phase 10 — US Market & Polish

1. **US eSIM**
   - On landing or via locale/country: show "US option" linking to eSIM-only flow (30/60/90 day plans); same queue and manual process.
2. **Error messages**
   - User-friendly messages for invalid ICCID, inactive/used voucher, payment failed, rate limited.
3. **Testing**
   - E2E: all three scenarios, inactive voucher rejection, Stripe test mode, admin complete → email received.
4. **README**
   - Setup, env vars, `prisma migrate deploy`, how to seed admin and plans, how to import vouchers.

---

## 8. Hostinger Deployment Checklist

1. **Node.js Web App**
   - hPanel → Websites → Add Website → Node.js Apps → Import Git Repository (GitHub).
2. **Build settings**
   - Install: `npm ci`
   - Build: `npm run build`
   - Start: `npm run start -- -p $PORT`
   - Node version: 20.
3. **Environment variables**
   - Add every key from `.env.example` in Hostinger’s env UI (no `.env` file in repo).
4. **Database**
   - Create MySQL database in hPanel; set `DATABASE_URL` in Hostinger env.
5. **Migrations**
   - Run migrations on deploy: add a deploy script that runs `npx prisma migrate deploy` (or run once manually via SSH/terminal if Hostinger provides it).
6. **Stripe webhook**
   - Point Stripe webhook URL to `https://yourdomain.com/api/stripe/webhook`; use production webhook secret in env.
7. **Domain**
   - Point activate.usalocalsim.com (or your domain) to the Node.js app; enable SSL.
8. **Email**
   - Configure Resend or SMTP (Hostinger SMTP or SendGrid); set `EMAIL_FROM` to a verified domain.

---

## 9. Quick Start Commands

```bash
# Clone and install
npm ci

# DB
npx prisma migrate dev
npx prisma db seed

# Run dev
npm run dev

# Build for production (same as Hostinger)
npm run build
npm run start -- -p 3000
```

---

## 10. Summary

| Item | Choice |
|------|--------|
| **Stack** | Next.js 14 (App Router) + TypeScript + Prisma + MySQL + NextAuth + Stripe + Nodemailer/Resend + next-intl |
| **Hosting** | Hostinger Business — Node.js Web App + MySQL + GitHub deploy |
| **Auth** | NextAuth Credentials, session in MySQL, roles admin/dealer |
| **Email** | Plan-specific templates; send only on admin "Complete"; use SMTP or Resend |
| **Fulfillment** | Manual: all submissions to queue; success email only after Complete |

Implement in the order of Section 7 (Foundation → Data → Portal → Stripe → Admin → Dealer → Security → i18n → Email → Polish). Use the development plan (`development-plan.md`) for feature details and this guide for stack and Hostinger-specific steps.
