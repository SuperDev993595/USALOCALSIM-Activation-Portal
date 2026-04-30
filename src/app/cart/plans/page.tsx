import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { CartPlansClient } from "@/components/CartPlansClient";

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
      upgradePlan: {
        select: {
          id: true,
          name: true,
          dataAllowance: true,
          durationDays: true,
          priceCents: true,
          market: true,
        },
      },
    },
  });

  const plans = prepaid
    ? [prepaid.basePlan, prepaid.upgradePlan].filter((p): p is NonNullable<typeof p> => p != null)
    : await prisma.plan.findMany({
        where: { planType: "physical_sim" },
        orderBy: [{ market: "asc" }, { durationDays: "asc" }],
        select: {
          id: true,
          name: true,
          dataAllowance: true,
          durationDays: true,
          priceCents: true,
          market: true,
        },
      });

  const pendingActivations = await prisma.cartPurchase.count({
    where: { cartSessionId: sid, status: "authorized" },
  });

  return (
    <div className="flex flex-1 justify-center py-4 sm:py-8">
      <CartPlansClient
        plans={plans}
        pendingActivations={pendingActivations}
        prepaidUpsell={Boolean(prepaid?.upgradePlanId)}
      />
    </div>
  );
}
