import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { CartRegistrationAndPayment } from "@/components/CartRegistrationAndPayment";
import { getPrepaidPaidRedirect } from "@/lib/prepaid-paid-redirect";
import { cartPhase1PathForPrepaid } from "@/lib/cart-phase1-route";

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
      voucher: { select: { voucherProductType: true, code: true } },
      basePlan: {
        select: {
          id: true,
          sku: true,
          name: true,
          dataAllowance: true,
          durationDays: true,
          priceCents: true,
          market: true,
          coverageTier: true,
        },
      },
    },
  });

  if (!prepaid?.basePlan) {
    redirect("/cart?needSerial=1");
  }

  const paidRedirect = await getPrepaidPaidRedirect(prepaid.id);
  if (paidRedirect) {
    redirect(paidRedirect.redirectPath);
  }

  const creditCheckoutPath = cartPhase1PathForPrepaid(prepaid);
  if (creditCheckoutPath !== "/cart/plans") {
    redirect(creditCheckoutPath);
  }

  const plans = [prepaid.basePlan];
  const defaultPayCents =
    prepaid.faceValueCents > 0 ? prepaid.faceValueCents : prepaid.basePlan.priceCents;

  return (
    <div className="cart-flow-page">
      <CartRegistrationAndPayment
        plans={plans}
        defaultPayCents={defaultPayCents}
        lockPayAmountCents={prepaid.faceValueCents > 0 ? prepaid.faceValueCents : undefined}
      />
    </div>
  );
}
