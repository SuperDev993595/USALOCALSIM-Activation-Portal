import type { CoverageTier } from "@/lib/coverage-tier";
import { creditsFromFaceValueCents } from "@/lib/linkup-exclusive-prepaid";
import {
  isGlobalVoucher,
  validateGlobalEntryBundle,
  globalTierCssModifier,
  type GlobalEntryBundleErrorCode,
} from "@/lib/global-exclusive-prepaid";
import {
  isLinkupExclusiveVoucher,
  validateLinkupEntryBundle,
  type LinkupEntryBundleErrorCode,
} from "@/lib/linkup-exclusive-prepaid";
import {
  isTmobileExclusiveVoucher,
  validateTmobileEntryBundle,
  type TmobileEntryBundleErrorCode,
} from "@/lib/tmobile-exclusive-prepaid";
import {
  isThreeUkExclusiveVoucher,
  validateThreeUkEntryBundle,
  type ThreeUkEntryBundleErrorCode,
} from "@/lib/three-uk-exclusive-prepaid";
import {
  isOrangeExclusiveVoucher,
  validateOrangeEntryBundle,
  type OrangeEntryBundleErrorCode,
} from "@/lib/orange-exclusive-prepaid";

import {
  isBasicUsaVoucher,
  validateBasicUsaEntryBundle,
  type BasicUsaEntryBundleErrorCode,
  type BasicUsaNetworkHint,
} from "@/lib/basic-usa-exclusive-prepaid";

export type CreditCheckoutProfileId =
  | "linkup_att"
  | "t_mobile"
  | "basic_usa"
  | "three_uk"
  | "orange"
  | "global";

export type CreditEntryBundleErrorCode =
  | LinkupEntryBundleErrorCode
  | TmobileEntryBundleErrorCode
  | BasicUsaEntryBundleErrorCode
  | ThreeUkEntryBundleErrorCode
  | OrangeEntryBundleErrorCode
  | GlobalEntryBundleErrorCode;

export type EntryBundleInput = {
  faceValueCents: number;
  basePlanSku: string | null | undefined;
  basePlanCoverageTier?: string | null | undefined;
};

export type EntryBundleResult =
  | { ok: true; coverageTier?: CoverageTier; networkHint?: BasicUsaNetworkHint }
  | { ok: false; code: CreditEntryBundleErrorCode };

export type CreditCheckoutProfile = {
  id: CreditCheckoutProfileId;
  i18nNamespace:
    | "cart.linkupCredit"
    | "cart.tmobileCredit"
    | "cart.basicUsaCredit"
    | "cart.threeUkCredit"
    | "cart.orangeCredit"
    | "cart.globalCredit";
  cssModifierClass: string;
  /** Fixed BRL reference when brlReferenceCentsForFaceValue is unset. */
  brlReferenceCents: number;
  brlReferenceCentsForFaceValue?: (faceValueCents: number) => number;
  usesCreditsDisplay: boolean;
  matchesVoucher: (voucher: { voucherProductType: string; code: string } | null | undefined) => boolean;
  validateEntryBundle: (input: EntryBundleInput) => EntryBundleResult;
  stripeLineItem: (input: {
    payAmountCents: number;
    faceValueCents: number;
    coverageTier?: CoverageTier;
  }) => { name: string; description: string };
  cssModifierForBundle?: (input: EntryBundleInput) => string;
};

const LINKUP_BRL_REFERENCE_CENTS = Number(process.env.NEXT_PUBLIC_LINKUP_BRL_REFERENCE_CENTS ?? "16500");
const TMOBILE_BRL_REFERENCE_CENTS = Number(process.env.NEXT_PUBLIC_TMOBILE_BRL_REFERENCE_CENTS ?? "21450");
const THREE_UK_BRL_USD_RATIO = Number(process.env.NEXT_PUBLIC_THREE_UK_BRL_USD_RATIO ?? "5.5");
const BASIC_USA_BRL_USD_RATIO = Number(process.env.NEXT_PUBLIC_BASIC_USA_BRL_USD_RATIO ?? "5.5");
const ORANGE_BRL_USD_RATIO = Number(process.env.NEXT_PUBLIC_ORANGE_BRL_USD_RATIO ?? "5.5");
const GLOBAL_BRL_USD_RATIO = Number(process.env.NEXT_PUBLIC_GLOBAL_BRL_USD_RATIO ?? "5.5");

function ratioBrlFromUsd(usdCents: number, ratio: number): number {
  return Math.round(usdCents * ratio);
}

function globalBrlFromUsd(usdCents: number): number {
  return ratioBrlFromUsd(usdCents, GLOBAL_BRL_USD_RATIO);
}

function threeUkBrlFromUsd(usdCents: number): number {
  return ratioBrlFromUsd(usdCents, THREE_UK_BRL_USD_RATIO);
}

function basicUsaBrlFromUsd(usdCents: number): number {
  return ratioBrlFromUsd(usdCents, BASIC_USA_BRL_USD_RATIO);
}

function orangeBrlFromUsd(usdCents: number): number {
  return ratioBrlFromUsd(usdCents, ORANGE_BRL_USD_RATIO);
}

const TIER_STRIPE_LABEL: Record<CoverageTier, string> = {
  basic: "BASIC",
  pro: "PRO",
  ultra: "ULTRA",
};

export const CREDIT_CHECKOUT_PROFILES: Record<CreditCheckoutProfileId, CreditCheckoutProfile> = {
  linkup_att: {
    id: "linkup_att",
    i18nNamespace: "cart.linkupCredit",
    cssModifierClass: "cart-flow-panel--linkup-credit",
    brlReferenceCents: LINKUP_BRL_REFERENCE_CENTS,
    usesCreditsDisplay: true,
    matchesVoucher: isLinkupExclusiveVoucher,
    validateEntryBundle: (input) => validateLinkupEntryBundle(input),
    stripeLineItem: ({ payAmountCents, faceValueCents }) => {
      const credits = creditsFromFaceValueCents(faceValueCents || payAmountCents);
      const usd = (payAmountCents / 100).toFixed(2);
      return {
        name: `LINKUP & AT&T — ${credits} Credits`,
        description: `Load ${credits} credits on your physical card ($${usd} USD at checkout). Redeem for 12GB, 30GB, or 50GB plans with your scratch PIN.`,
      };
    },
  },
  t_mobile: {
    id: "t_mobile",
    i18nNamespace: "cart.tmobileCredit",
    cssModifierClass: "cart-flow-panel--tmobile-credit",
    brlReferenceCents: TMOBILE_BRL_REFERENCE_CENTS,
    usesCreditsDisplay: false,
    matchesVoucher: isTmobileExclusiveVoucher,
    validateEntryBundle: (input) => validateTmobileEntryBundle(input),
    stripeLineItem: ({ payAmountCents }) => {
      const usd = (payAmountCents / 100).toFixed(2);
      return {
        name: `T-Mobile Unlimited — 10 days`,
        description: `Fund your T-Mobile exclusive voucher ($${usd} USD at checkout). Redeem for 10-day unlimited USA data — eSIM or physical SIM — with your scratch PIN.`,
      };
    },
  },
  basic_usa: {
    id: "basic_usa",
    i18nNamespace: "cart.basicUsaCredit",
    cssModifierClass: "cart-flow-panel--basic-usa-credit",
    brlReferenceCents: 0,
    brlReferenceCentsForFaceValue: basicUsaBrlFromUsd,
    usesCreditsDisplay: false,
    matchesVoucher: isBasicUsaVoucher,
    validateEntryBundle: (input) => {
      const result = validateBasicUsaEntryBundle(input);
      if (!result.ok) return result;
      return { ok: true, coverageTier: "basic", networkHint: result.networkHint };
    },
    stripeLineItem: ({ payAmountCents, faceValueCents }) => {
      const usd = (payAmountCents / 100).toFixed(2);
      const credits = creditsFromFaceValueCents(faceValueCents || payAmountCents);
      const linkupStyle = faceValueCents === 3000;
      return {
        name: linkupStyle
          ? `Basic USA — T-Mobile & LinkUP (${credits} Credits)`
          : `Basic USA — T-Mobile & LinkUP Pre-Paid`,
        description: `Fund your combined Basic USA voucher ($${usd} USD). Redeem on T-Mobile or LINKUP & AT&T with your scratch PIN in Phase 2.`,
      };
    },
  },
  three_uk: {
    id: "three_uk",
    i18nNamespace: "cart.threeUkCredit",
    cssModifierClass: "cart-flow-panel--three-uk-credit",
    brlReferenceCents: 0,
    brlReferenceCentsForFaceValue: threeUkBrlFromUsd,
    usesCreditsDisplay: false,
    matchesVoucher: isThreeUkExclusiveVoucher,
    validateEntryBundle: (input) => validateThreeUkEntryBundle(input),
    stripeLineItem: ({ payAmountCents }) => {
      const usd = (payAmountCents / 100).toFixed(2);
      return {
        name: `Three UK — 72 Countries Pre-Paid Voucher`,
        description: `Fund your Three UK exclusive voucher ($${usd} USD at checkout). Redeem across 72 countries — eSIM or physical SIM — with your scratch PIN.`,
      };
    },
  },
  orange: {
    id: "orange",
    i18nNamespace: "cart.orangeCredit",
    cssModifierClass: "cart-flow-panel--orange-credit",
    brlReferenceCents: 0,
    brlReferenceCentsForFaceValue: orangeBrlFromUsd,
    usesCreditsDisplay: false,
    matchesVoucher: isOrangeExclusiveVoucher,
    validateEntryBundle: (input) => validateOrangeEntryBundle(input),
    stripeLineItem: ({ payAmountCents }) => {
      const usd = (payAmountCents / 100).toFixed(2);
      return {
        name: `Orange ULTRA eSIM — 200+ Countries`,
        description: `Fund your Orange exclusive eSIM voucher ($${usd} USD at checkout). Redeem worldwide Orange ULTRA plans with your scratch PIN — eSIM only.`,
      };
    },
  },
  global: {
    id: "global",
    i18nNamespace: "cart.globalCredit",
    cssModifierClass: "cart-flow-panel--global-credit",
    brlReferenceCents: 0,
    brlReferenceCentsForFaceValue: globalBrlFromUsd,
    usesCreditsDisplay: false,
    matchesVoucher: isGlobalVoucher,
    validateEntryBundle: (input) => {
      const result = validateGlobalEntryBundle({
        faceValueCents: input.faceValueCents,
        basePlanCoverageTier: input.basePlanCoverageTier,
      });
      if (!result.ok) return result;
      return { ok: true, coverageTier: result.tier };
    },
    cssModifierForBundle: (input) => {
      const result = validateGlobalEntryBundle({
        faceValueCents: input.faceValueCents,
        basePlanCoverageTier: input.basePlanCoverageTier,
      });
      if (!result.ok) return "cart-flow-panel--global-credit";
      return globalTierCssModifier(result.tier);
    },
    stripeLineItem: ({ payAmountCents, coverageTier }) => {
      const usd = (payAmountCents / 100).toFixed(2);
      const tierLabel = coverageTier ? TIER_STRIPE_LABEL[coverageTier] : "Global";
      return {
        name: `USALOCALSIM Global — ${tierLabel} Pre-Paid Voucher`,
        description: `Fund your Global ${tierLabel} pre-paid voucher ($${usd} USD at checkout). Redeem for network and plan selection with your scratch PIN in Phase 2.`,
      };
    },
  },
};

export const CREDIT_CHECKOUT_PROFILE_ORDER: CreditCheckoutProfileId[] = [
  "linkup_att",
  "t_mobile",
  "basic_usa",
  "three_uk",
  "orange",
  "global",
];

export function creditCheckoutProfileById(id: CreditCheckoutProfileId): CreditCheckoutProfile {
  return CREDIT_CHECKOUT_PROFILES[id];
}

export function resolveCreditCheckoutProfile(input: EntryBundleInput & {
  voucher: { voucherProductType: string; code: string } | null | undefined;
}): (CreditCheckoutProfile & { coverageTier?: CoverageTier; networkHint?: BasicUsaNetworkHint }) | null {
  for (const id of CREDIT_CHECKOUT_PROFILE_ORDER) {
    const profile = CREDIT_CHECKOUT_PROFILES[id];
    if (!profile.matchesVoucher(input.voucher)) continue;
    const bundle = profile.validateEntryBundle(input);
    if (!bundle.ok) continue;
    return { ...profile, coverageTier: bundle.coverageTier, networkHint: bundle.networkHint };
  }
  return null;
}

export function resolveCreditCheckoutProfileOrError(input: EntryBundleInput & {
  voucher: { voucherProductType: string; code: string } | null | undefined;
}):
  | { ok: true; profile: CreditCheckoutProfile; profileId: CreditCheckoutProfileId; coverageTier?: CoverageTier; networkHint?: BasicUsaNetworkHint }
  | { ok: false; profileId: CreditCheckoutProfileId; code: CreditEntryBundleErrorCode } {
  for (const id of CREDIT_CHECKOUT_PROFILE_ORDER) {
    const profile = CREDIT_CHECKOUT_PROFILES[id];
    if (!profile.matchesVoucher(input.voucher)) continue;
    const bundle = profile.validateEntryBundle(input);
    if (!bundle.ok) {
      return { ok: false, profileId: id, code: bundle.code };
    }
    return { ok: true, profile, profileId: id, coverageTier: bundle.coverageTier, networkHint: bundle.networkHint };
  }
  return { ok: false, profileId: "global", code: "MISSING_TIER" };
}

export function isCreditCheckoutEligible(input: EntryBundleInput & {
  voucher: { voucherProductType: string; code: string } | null | undefined;
}): boolean {
  return resolveCreditCheckoutProfile(input) != null;
}

export function creditCheckoutCssModifier(
  profileId: CreditCheckoutProfileId,
  input: EntryBundleInput,
): string {
  const profile = CREDIT_CHECKOUT_PROFILES[profileId];
  return profile.cssModifierForBundle?.(input) ?? profile.cssModifierClass;
}
