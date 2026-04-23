import type Stripe from "stripe";

/** Current Stripe Checkout `metadata.flow` for physical-card cart purchases. */
export const STRIPE_CART_CHECKOUT_FLOW = "cart_voucher";

/** Current Stripe Checkout metadata key for the verified phone session id. */
export const STRIPE_CART_SESSION_METADATA_KEY = "cartSessionId";

/** ActivationRequest.scenario for redemptions from this flow. */
export const ACTIVATION_SCENARIO_CART_VOUCHER = "cart_voucher";

/** Older rows used this scenario string before the cart rename. */
export const ACTIVATION_SCENARIO_CART_VOUCHER_LEGACY = ["sh", "op", "_voucher"].join("");

const LEGACY_FLOW = ["sh", "op", "_voucher"].join("");
const LEGACY_SESSION_KEY = ["sh", "op", "Session", "Id"].join("");

export function isStripeCartVoucherFlow(flow: string | undefined): boolean {
  if (!flow) return false;
  if (flow === STRIPE_CART_CHECKOUT_FLOW) return true;
  return flow === LEGACY_FLOW;
}

export function readCartSessionIdFromStripeMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string {
  const m = (metadata ?? {}) as Record<string, string | undefined>;
  const current = m[STRIPE_CART_SESSION_METADATA_KEY];
  if (typeof current === "string" && current.trim()) return current.trim();
  const legacy = m[LEGACY_SESSION_KEY];
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim();
  return "";
}
