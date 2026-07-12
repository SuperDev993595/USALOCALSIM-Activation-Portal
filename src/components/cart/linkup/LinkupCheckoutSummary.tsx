import type { ComponentProps } from "react";
import { CreditCheckoutSummary } from "@/components/cart/credit/CreditCheckoutSummary";

/** @deprecated Use CreditCheckoutSummary with profileId="linkup_att" */
export function LinkupCheckoutSummary(
  props: Omit<ComponentProps<typeof CreditCheckoutSummary>, "profileId">,
) {
  return <CreditCheckoutSummary profileId="linkup_att" {...props} />;
}
