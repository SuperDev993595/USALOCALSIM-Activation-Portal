import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SHOP_SESSION_COOKIE } from "@/lib/shop-session";
import { ShopPlansClient } from "@/components/ShopPlansClient";

export default async function ShopPlansPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SHOP_SESSION_COOKIE)?.value;
  if (!sid) {
    redirect("/shop");
  }

  const session = await prisma.shopSession.findFirst({
    where: { id: sid, expiresAt: { gt: new Date() } },
  });
  if (!session) {
    redirect("/shop");
  }

  const plans = await prisma.plan.findMany({
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

  return (
    <div className="flex flex-1 justify-center py-4 sm:py-8">
      <ShopPlansClient plans={plans} />
    </div>
  );
}
