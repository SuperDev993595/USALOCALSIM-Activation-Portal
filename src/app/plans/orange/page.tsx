import { RedeemPageBackground } from "@/components/RedeemPageBackground";
import { OrangeLanding } from "@/components/OrangeLanding";
import { listOrangePublicPlans } from "@/lib/orange-public-plans";

/** Product information only — not a redeem entry point (unlike /redeem/three-uk). */
export default async function OrangePlansPage() {
  const plans = await listOrangePublicPlans();

  return (
    <RedeemPageBackground>
      <OrangeLanding plans={plans} />
    </RedeemPageBackground>
  );
}
