import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import type { VoucherProductType } from "../src/lib/voucher-product-type";
import { DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS } from "../src/lib/prepaid-voucher";

type DemoCardSeed = {
  label: string;
  serial: string;
  pin: string;
  voucherProductType: VoucherProductType;
  retailMarket: string;
  faceValueCents: number;
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

/** Minimal POS-paid authorize for demo cards (no @/ imports — ts-node seed safe). */
async function authorizeDemoPurchase(
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

  const externalRef = `seed:demo:${input.serial}`;
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
      stripePaymentId: `pos:${externalRef}`,
      paymentSource: "pos",
      externalPaymentRef: externalRef,
      amountPaidCents: input.faceValueCents,
      customerEmail: "demo@usalocalsim.com",
      customerName: "Demo Traveler",
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
      customerEmail: "demo@usalocalsim.com",
      customerName: "Demo Traveler",
    },
  });
}

async function seedOneDemoCard(
  prisma: PrismaClient,
  card: DemoCardSeed,
  basePlanId: string,
  upgradePlanId: string | null,
): Promise<void> {
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
        voucherProductType: card.voucherProductType,
        creditAmountCents: card.faceValueCents,
        planId: basePlanId,
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
          voucherProductType: card.voucherProductType,
          creditAmountCents: card.faceValueCents,
          planId: basePlanId,
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
          voucherProductType: card.voucherProductType,
          planId: basePlanId,
          creditAmountCents: card.faceValueCents,
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
      retailMarket: card.retailMarket,
      faceValueCents: card.faceValueCents,
      voucherId,
      basePlanId,
      upgradePlanId,
    },
    update: {
      barcodePayload: card.serial,
      retailMarket: card.retailMarket,
      faceValueCents: card.faceValueCents,
      voucherId,
      basePlanId,
      upgradePlanId,
    },
  });

  await authorizeDemoPurchase(prisma, {
    prepaidCardId: prepaid.id,
    voucherId,
    planId: basePlanId,
    faceValueCents: card.faceValueCents,
    serial: card.serial,
  });

  console.log(
    `  [${card.voucherProductType}] ${card.label}\n` +
      `    Serial (POS scan): ${card.serial}\n` +
      `    Scratch PIN:       ${pinNorm}\n` +
      `    Credit:            $${(card.faceValueCents / 100).toFixed(2)}`,
  );
}

/**
 * Redeem-ready demo prepaid cards with prefixed scratch PINs (see doc/scratch-pin-formats.md).
 */
export async function seedDemoPrepaidCards(
  prisma: PrismaClient,
  opts: { basePlanId: string; upgradePlanId?: string | null },
): Promise<void> {
  const cartSerial = process.env.PREPAID_DEMO_SERIAL?.trim() || "USALOCALDEMO123";

  const cards: DemoCardSeed[] = [
    {
      label: "Global — direct redeem test",
      serial: "USALOCALGLO001",
      pin: "USL-G-DEMO0001",
      voucherProductType: "global",
      retailMarket: "us",
      faceValueCents: DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS,
    },
    {
      label: "Three UK exclusive — direct redeem test",
      serial: "USALOCAL3UK001",
      pin: "USLTUK-DEMO0001",
      voucherProductType: "three_uk",
      retailMarket: "uk",
      faceValueCents: DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS,
    },
    {
      label: "T-Mobile exclusive — direct redeem test",
      serial: "USALOCALTM001",
      pin: "USLTM-DEMO0001",
      voucherProductType: "t_mobile",
      retailMarket: "us",
      faceValueCents: 3900,
    },
    {
      label: "LINKUP & AT&T exclusive — direct redeem test",
      serial: "USALOCALATT001",
      pin: "USLATT-DEMO0001",
      voucherProductType: "linkup_att",
      retailMarket: "us",
      faceValueCents: 3000,
    },
    {
      label: "Global — dealer POS / redeem demo",
      serial: cartSerial,
      pin: "USL-G-DEMO0002",
      voucherProductType: "global",
      retailMarket: "us",
      faceValueCents: 5000,
    },
  ];

  console.log("Seeded demo prepaid cards (POS-paid / redeem-ready):");
  for (const card of cards) {
    await seedOneDemoCard(prisma, card, opts.basePlanId, opts.upgradePlanId ?? null);
  }
  console.log("  Enter scratch PIN at /redeem/enter — Global → /redeem, Three UK → /redeem/three-uk, T-Mobile → /redeem/t-mobile, Linkup → /redeem/linkup-att");
}
