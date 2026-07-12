import type { ComponentProps } from "react";
import { CreditPaymentOptions } from "@/components/cart/credit/CreditPaymentOptions";

/** @deprecated Use CreditPaymentOptions with profileId="linkup_att" */
export function LinkupPaymentOptions(
  props: Omit<ComponentProps<typeof CreditPaymentOptions>, "profileId">,
) {
  return <CreditPaymentOptions profileId="linkup_att" {...props} />;
}
