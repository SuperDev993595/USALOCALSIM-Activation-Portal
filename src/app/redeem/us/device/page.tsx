import { redirect } from "next/navigation";

/** Legacy US device step — unified scratch-first redeem. */
export default function LegacyRedeemUsDevicePage() {
  redirect("/redeem/enter");
}
