# USALOCALSIM Activation Portal

Manual request-capture portal for USALOCALSIM activation. Supports three flows: **SIM Only** (pay via Stripe), **Combo** (ICCID + voucher → $0), and **eSIM Voucher** (voucher only → $0). All submissions go to an admin queue; success email is sent only after an admin clicks **Complete**.

## Tech stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **MySQL** + Prisma
- **NextAuth** (Credentials, database sessions) for admin and dealer
- **Stripe** (Checkout + webhook) for SIM Only payments
- **next-intl** for localization (EN, FR, JA, NL, ZH, ES, HI); locale from cookie + Accept-Language
- **Nodemailer** or **Resend** for plan-specific success emails

## Prerequisites

- Node.js 20+
- MySQL 8 (e.g. Hostinger Business MySQL)

## Setup

1. **Clone and install**

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – MySQL connection string (e.g. `mysql://user:pass@host:3306/dbname`)
   - `NEXTAUTH_URL` – app URL (e.g. `http://localhost:3000`)
   - `NEXTAUTH_SECRET` – random secret (e.g. `openssl rand -base64 32`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for Stripe
   - Email: either `RESEND_API_KEY` + `EMAIL_FROM`, or `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
   - `NEXT_PUBLIC_APP_URL` – same as NEXTAUTH_URL for production
   - `SIM_HARDWARE_COST_CENTS` – amount to deduct for SIM Only (e.g. 999)

3. **Database**

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

   Seed creates an admin user (default: `admin@usalocalsim.com` / `ChangeMe123!`) and default plans. Override with `ADMIN_EMAIL` and `ADMIN_PASSWORD` when running seed.

4. **Run**

   ```bash
   npm run dev
   ```

   - Portal: http://localhost:3000  
   - Admin: http://localhost:3000/admin (admin only)  
   - Dealer: http://localhost:3000/dealer (admin or dealer)  
   - Login: http://localhost:3000/login  

## Hostinger Business deploy

- **Node.js Web App**: connect GitHub repo; set Install `npm ci`, Build `npm run build`, Start `npm run start -- -p $PORT`; Node 20.
- Add all env vars in the Hostinger dashboard.
- Create a MySQL database in hPanel and set `DATABASE_URL`.
- Run migrations once (e.g. via deploy script or SSH): `npx prisma migrate deploy`.
- Point Stripe webhook to `https://yourdomain.com/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`.

## Creating dealers

Insert users with `role: "dealer"` (and hashed password) via Prisma or a seed script. Only admin can access `/admin`; admin and dealer can access `/dealer` for unlocking vouchers.

## Importing vouchers

As admin, go to **Admin → Import vouchers**. Paste codes (one per line or comma-separated), select plan and voucher type (top_up / esim), then Import. Vouchers start as **inactive**; dealers unlock them in the Dealer panel after sale.

## Project layout

- `src/app/` – routes (public activation, activate, admin, dealer, login)
- `src/app/api/` – validate, submit, Stripe checkout/webhook, admin complete/queue, dealer unlock
- `src/lib/` – db, auth, stripe, email, rate-limit
- `src/i18n/` – locale detection and message JSON (en, fr, ja, nl, zh, es, hi)
- `prisma/` – schema and migrations

See `doc/development-plan.md`, `doc/use-cases.md`, and `doc/implementation-guide-hostinger.md` for full spec, use cases, and implementation details.
