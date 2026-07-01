import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import type { VoucherProductType } from "../src/lib/voucher-product-type";

type CartCardSeed = {
  label: string;
  serial: string;
  pin: string;
  faceValueCents: number;
  /** unpaid — QR → plans → Stripe checkout; stripe_paid — redeem without Stripe */
  state: "unpaid" | "stripe_paid";
  voucherProductType?: VoucherProductType;
  /** Override bundled plan (e.g. ATT-LIM-12GB for Linkup credit cards). */
  basePlanId?: string;
};

function pinLast4(raw: string): string {
  return raw.trim().toUpperCase().slice(-4);
}

function opaqueToken(): string {
  return randomBytes(32).toString("hex");
}

function newTokenExpiresAt(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function newCartSessionExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function upsertCartPrepaidCard(
  prisma: PrismaClient,
  card: CartCardSeed,
  basePlanId: string,
  upgradePlanId: string | null,
  voucherProductType: VoucherProductType,
): Promise<{ prepaidCardId: string; voucherId: string }> {
  const pinNorm = card.pin.trim().toUpperCase();
  const pinHash = await hash(pinNorm, 10);
  const last4 = pinLast4(pinNorm);

  const existingPrepaid = await prisma.prepaidCard.findUnique({
    where: { serial: card.serial },
    include: { voucher: true },
  });

  let voucherId: string;

  if (existingPrepaid?.voucher) {
    const updated = await prisma.voucher.update({
      where: { id: existingPrepaid.voucherId },
      data: {
        code: pinNorm,
        pinCodeHash: pinHash,
        pinLast4: last4,
        voucherProductType,
        creditAmountCents: card.faceValueCents,
        planId: basePlanId,
        ...(card.state === "unpaid"
          ? { status: "inactive", paymentStatus: false }
          : {}),
      },
    });
    voucherId = updated.id;
  } else {
    const byCode = await prisma.voucher.findUnique({ where: { code: pinNorm } });
    if (byCode) {
      const updated = await prisma.voucher.update({
        where: { id: byCode.id },
        data: {
          pinCodeHash: pinHash,
          pinLast4: last4,
          voucherProductType,
          creditAmountCents: card.faceValueCents,
          planId: basePlanId,
          ...(card.state === "unpaid"
            ? { status: "inactive", paymentStatus: false }
            : {}),
        },
      });
      voucherId = updated.id;
    } else {
      const created = await prisma.voucher.create({
        data: {
          code: pinNorm,
          pinCodeHash: pinHash,
          pinLast4: last4,
          status: "inactive",
          type: "top_up",
          voucherProductType,
          planId: basePlanId,
          creditAmountCents: card.faceValueCents,
          paymentStatus: false,
        },
      });
      voucherId = created.id;
    }
  }

  const prepaid = await prisma.prepaidCard.upsert({
    where: { serial: card.serial },
    create: {
      serial: card.serial,
      barcodePayload: card.serial,
      retailMarket: "us",
      faceValueCents: card.faceValueCents,
      voucherId,
      basePlanId,
      upgradePlanId,
    },
    update: {
      barcodePayload: card.serial,
      retailMarket: "us",
      faceValueCents: card.faceValueCents,
      voucherId,
      basePlanId,
      upgradePlanId,
    },
  });

  return { prepaidCardId: prepaid.id, voucherId };
}

/** Simulates a completed Stripe cart checkout (webhook) for redeem testing without payment. */
async function authorizeStripePaidCart(
  prisma: PrismaClient,
  input: {
    prepaidCardId: string;
    voucherId: string;
    planId: string;
    faceValueCents: number;
    serial: string;
  },
): Promise<void> {
  const existing = await prisma.cartPurchase.findFirst({
    where: { prepaidCardId: input.prepaidCardId, status: "authorized" },
    select: { id: true },
  });
  if (existing) return;

  const externalRef = `seed:cart-stripe:${input.serial}`;
  const byRef = await prisma.cartPurchase.findFirst({
    where: { externalPaymentRef: externalRef },
    select: { id: true },
  });
  if (byRef) return;

  const session = await prisma.cartSession.create({
    data: { expiresAt: newCartSessionExpiry() },
  });

  const resumeToken = opaqueToken();
  const accessToken = opaqueToken();

  const purchase = await prisma.cartPurchase.create({
    data: {
      cartSessionId: session.id,
      planId: input.planId,
      stripePaymentId: `pi_seed_cart_${input.serial}`,
      paymentSource: "stripe",
      externalPaymentRef: externalRef,
      amountPaidCents: input.faceValueCents,
      customerEmail: "cart-demo@usalocalsim.com",
      customerName: "Cart Demo Traveler",
      status: "authorized",
      prepaidCardId: input.prepaidCardId,
      voucherId: input.voucherId,
      redemptionAccessToken: accessToken,
      redemptionAccessExpiresAt: newTokenExpiresAt(),
    },
  });

  await prisma.cartPurchaseResumeToken.create({
    data: {
      token: resumeToken,
      cartPurchaseId: purchase.id,
      expiresAt: newTokenExpiresAt(),
    },
  });

  await prisma.voucher.update({
    where: { id: input.voucherId },
    data: {
      status: "eligible",
      paymentStatus: true,
      creditAmountCents: input.faceValueCents,
      declaredPayCents: input.faceValueCents,
      customerEmail: "cart-demo@usalocalsim.com",
      customerName: "Cart Demo Traveler",
    },
  });
}

async function seedOneCartCard(
  prisma: PrismaClient,
  card: CartCardSeed,
  basePlanId: string,
  upgradePlanId: string | null,
): Promise<void> {
  const effectiveBasePlanId = card.basePlanId ?? basePlanId;
  const voucherProductType = card.voucherProductType ?? "global";
  const { prepaidCardId, voucherId } = await upsertCartPrepaidCard(
    prisma,
    card,
    effectiveBasePlanId,
    upgradePlanId,
    voucherProductType,
  );

  if (card.state === "stripe_paid") {
    await authorizeStripePaidCart(prisma, {
      prepaidCardId,
      voucherId,
      planId: effectiveBasePlanId,
      faceValueCents: card.faceValueCents,
      serial: card.serial,
    });
  }

  const flowHint =
    card.state === "unpaid"
      ? `/cart?serial=${card.serial} → plans → Stripe test checkout`
      : `/cart?serial=${card.serial} → redirects to redeem (already paid)`;

  console.log(
    `  [${card.state}] ${card.label}\n` +
      `    Serial (QR):     ${card.serial}\n` +
      `    Scratch PIN:     ${card.pin.trim().toUpperCase()}\n` +
      `    Face value:      $${(card.faceValueCents / 100).toFixed(2)}\n` +
      `    Test flow:       ${flowHint}`,
  );
}

/**
 * Demo prepaid cards for D2C cart (Phase 1): unpaid checkout + stripe-paid redeem.
 */
export async function seedDemoCartCards(
  prisma: PrismaClient,
  opts: { basePlanId: string; upgradePlanId?: string | null },
): Promise<void> {
  const checkoutSerial = process.env.CART_DEMO_SERIAL?.trim() || "USALOCARTCHK01";
  const linkupPlan = await prisma.plan.findFirst({
    where: { sku: "ATT-LIM-12GB", planType: "physical_sim", active: true },
    select: { id: true },
  });

  const cards: CartCardSeed[] = [
    {
      label: "Cart checkout — unpaid (Stripe test)",
      serial: checkoutSerial,
      pin: "USL-G-CART0001",
      faceValueCents: 5000,
      state: "unpaid",
    },
    {
      label: "Cart paid — redeem after checkout",
      serial: "USALOCARTPAID01",
      pin: "USL-G-CART0002",
      faceValueCents: 5000,
      state: "stripe_paid",
    },
    {
      label: "Linkup credit cart — $30 / 12GB (credit checkout UI)",
      serial: "USALOCARTATT01",
      pin: "USLATT-CART0001",
      faceValueCents: 3000,
      state: "unpaid",
      voucherProductType: "linkup_att",
      basePlanId: linkupPlan?.id,
    },
  ];

  console.log("Seeded demo cart cards:");
  for (const card of cards) {
    await seedOneCartCard(prisma, card, opts.basePlanId, opts.upgradePlanId ?? null);
  }
}
