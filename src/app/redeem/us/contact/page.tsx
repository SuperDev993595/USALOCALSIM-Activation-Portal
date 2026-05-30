import { redirect } from "next/navigation";

/** Legacy US contact step — unified scratch-first redeem. */
export default function LegacyRedeemUsContactPage() {
  redirect("/redeem/enter");
}
