import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { CartRegistrationAndPayment } from "@/components/CartRegistrationAndPayment";
import { getPrepaidPaidRedirect } from "@/lib/prepaid-paid-redirect";
import { isLinkupExclusiveVoucher } from "@/lib/linkup-exclusive-prepaid";

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

  if (isLinkupExclusiveVoucher(prepaid.voucher)) {
    redirect("/cart/checkout");
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
