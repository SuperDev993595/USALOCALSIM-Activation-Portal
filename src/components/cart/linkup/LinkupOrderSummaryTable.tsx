import type { ComponentProps } from "react";
import { CreditOrderSummaryTable } from "@/components/cart/credit/CreditOrderSummaryTable";

/** @deprecated Use CreditOrderSummaryTable with profileId="linkup_att" */
export function LinkupOrderSummaryTable(
  props: Omit<ComponentProps<typeof CreditOrderSummaryTable>, "profileId">,
) {
  return <CreditOrderSummaryTable profileId="linkup_att" {...props} />;
}
