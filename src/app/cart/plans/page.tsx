import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { CartRegistrationAndPayment } from "@/components/CartRegistrationAndPayment";

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

  if (prepaid.voucher.creditAmountCents <= 0) {
    redirect("/cart?needVoucherCredit=1");
  }

  const plans = [prepaid.basePlan];

  return (
    <div className="flex flex-1 justify-center py-4 sm:py-8">
      <CartRegistrationAndPayment plans={plans} />
    </div>
  );
}
