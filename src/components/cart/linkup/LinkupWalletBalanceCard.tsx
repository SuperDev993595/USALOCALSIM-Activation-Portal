import type { ComponentProps } from "react";
import { CreditWalletBalanceCard } from "@/components/cart/credit/CreditWalletBalanceCard";

/** @deprecated Use CreditWalletBalanceCard with profileId="linkup_att" */
export function LinkupWalletBalanceCard(
  props: Omit<ComponentProps<typeof CreditWalletBalanceCard>, "profileId">,
) {
  return <CreditWalletBalanceCard profileId="linkup_att" {...props} />;
}
