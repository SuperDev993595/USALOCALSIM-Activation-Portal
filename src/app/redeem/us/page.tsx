import { redirect } from "next/navigation";

/** Legacy international flow — unified on scratch-first redeem. */
export default function LegacyRedeemUsPage() {
  redirect("/redeem/enter");
}
