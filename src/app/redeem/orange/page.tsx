import { redirect } from "next/navigation";

/** Orange plans are product info only — use /plans/orange (no dedicated redeem hub). */
export default function RedeemOrangeRedirect() {
  redirect("/plans/orange");
}
