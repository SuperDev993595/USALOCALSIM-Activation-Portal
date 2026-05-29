/** Stripe Checkout: card + Apple Pay / Google Pay when wallets enabled (domain must be verified in Stripe). */
export function stripeCheckoutPaymentOptions():
  | { automatic_payment_methods: { enabled: true } }
  | { payment_method_types: ["card"] } {
  const wallets =
    process.env.STRIPE_ENABLE_WALLETS === undefined || process.env.STRIPE_ENABLE_WALLETS === "true";
  if (wallets) {
    return {
      automatic_payment_methods: { enabled: true },
    };
  }
  return { payment_method_types: ["card"] };
}
