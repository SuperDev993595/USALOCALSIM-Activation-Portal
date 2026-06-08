import type { RedeemFulfillmentType } from "@/components/RedeemFulfillmentPicker";

export type FulfillmentOptionMeta = {
  value: RedeemFulfillmentType;
  iconSrc: string;
  labelKey: "optExistingSim" | "optShipping" | "optEsim";
  hintKey: "fulfillmentExistingHint" | "fulfillmentShippingHint" | "fulfillmentEsimHint";
};

const META: FulfillmentOptionMeta[] = [
  {
    value: "EXISTING_SIM",
    iconSrc: "/images/sim/tri-cut-sim-2025-white.svg",
    labelKey: "optExistingSim",
    hintKey: "fulfillmentExistingHint",
  },
  {
    value: "NEW_SIM_SHIPPING",
    iconSrc: "/images/sim/tri-cut-sim-2025-white.svg",
    labelKey: "optShipping",
    hintKey: "fulfillmentShippingHint",
  },
  {
    value: "ESIM",
    iconSrc: "/images/sim/esim-logo-2025-white.svg",
    labelKey: "optEsim",
    hintKey: "fulfillmentEsimHint",
  },
];

export function fulfillmentOptionMeta(type: RedeemFulfillmentType): FulfillmentOptionMeta {
  return META.find((m) => m.value === type) ?? META[0]!;
}
