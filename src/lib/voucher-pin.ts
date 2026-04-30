import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

function normalize(raw: string) {
  return raw.trim().toUpperCase();
}

export function pinLast4(raw: string): string {
  const n = normalize(raw);
  return n.slice(-4);
}

export async function matchesVoucherPin(
  voucher: { code: string; pinCodeHash: string | null },
  pinInput: string,
): Promise<boolean> {
  const pin = normalize(pinInput);
  if (!pin) return false;
  if (voucher.pinCodeHash) {
    try {
      return await compare(pin, voucher.pinCodeHash);
    } catch {
      return false;
    }
  }
  return voucher.code.toUpperCase() === pin;
}

export async function resolveVoucherByPin(pinInput: string) {
  const pin = normalize(pinInput);
  if (!pin) return null;

  const direct = await prisma.voucher.findUnique({
    where: { code: pin },
    include: { plan: true, prepaidCard: true },
  });
  if (direct && (await matchesVoucherPin(direct, pin))) return direct;

  const last4 = pinLast4(pin);
  const candidates = await prisma.voucher.findMany({
    where: {
      pinLast4: last4 || undefined,
      pinCodeHash: { not: null },
      status: { in: ["inactive", "activated"] },
      paymentStatus: true,
    },
    include: { plan: true, prepaidCard: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  for (const v of candidates) {
    if (await matchesVoucherPin(v, pin)) return v;
  }
  return null;
}
