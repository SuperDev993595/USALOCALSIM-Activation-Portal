import type { BasicTierPlanSeed } from "@/lib/basic-tier-catalog";
import { BASIC_LINKUP_PLANS, BASIC_TMOBILE_PLANS } from "@/lib/basic-tier-catalog";

export type BasicExclusivePublicPlan = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
};

function seedToPublic(plan: BasicTierPlanSeed): BasicExclusivePublicPlan {
  return {
    sku: plan.sku,
    name: plan.name,
    dataAllowance: plan.dataAllowance,
    durationDays: plan.durationDays,
    priceCents: plan.priceCents,
  };
}

export function listTmobileExclusivePublicPlans(): BasicExclusivePublicPlan[] {
  return BASIC_TMOBILE_PLANS.map(seedToPublic);
}

export function listLinkupExclusivePublicPlans(): BasicExclusivePublicPlan[] {
  return BASIC_LINKUP_PLANS.map(seedToPublic);
}
