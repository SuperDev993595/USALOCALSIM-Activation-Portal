import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { CartPlansClient } from "@/components/CartPlansClient";
import { phase1PrepaidChargeCents } from "@/lib/prepaid-cart";

export default async function CartPlansPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (!sid) {
    redirect("/cart");
  }

  const session = await prisma.cartSession.findFirst({
    where: { id: sid, expiresAt: { gt: new Date() } },
  });
  if (!session) {
    redirect("/cart");
  }

  const prepaid = await prisma.prepaidCard.findFirst({
    where: { claimedCartSessionId: sid },
    include: {
      basePlan: {
        select: {
          id: true,
          name: true,
          dataAllowance: true,
          durationDays: true,
          priceCents: true,
          market: true,
        },
      },
      voucher: { select: { creditAmountCents: true } },
    },
  });

  if (!prepaid?.basePlan) {
    redirect("/cart?needSerial=1");
  }

  const chargeCents = phase1PrepaidChargeCents(prepaid.voucher.creditAmountCents, prepaid.basePlan.priceCents);
  if (chargeCents <= 0) {
    redirect("/cart?needSerial=1");
  }

  const plans = [prepaid.basePlan];

  return (
    <div className="flex flex-1 justify-center py-4 sm:py-8">
      <CartPlansClient plans={plans} chargeCents={chargeCents} />
    </div>
  );
}
