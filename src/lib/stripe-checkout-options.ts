/**
 * Stripe Checkout Session payment setup.
 * Uses `payment_method_types` for compatibility with account API versions that
 * do not accept `automatic_payment_methods` on Checkout (e.g. 2025-02-24.acacia).
 * Apple Pay / Google Pay can still appear for `card` when enabled in the Stripe Dashboard.
 */
export function stripeCheckoutPaymentOptions(): {
  payment_method_types: ["card"];
} {
  return { payment_method_types: ["card"] };
}
