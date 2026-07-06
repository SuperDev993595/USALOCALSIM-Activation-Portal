import type { CartSession } from "@prisma/client";

export const CART_GUEST_CUSTOMER_NAME = "Guest Customer";

export function resolveCartCheckoutCustomer(
  session: Pick<CartSession, "checkoutEmail" | "checkoutCustomerName">,
  body?: { email?: string; customerName?: string },
): { email: string | null; customerName: string } {
  const email = body?.email?.trim() || session.checkoutEmail?.trim() || null;
  const customerName =
    body?.customerName?.trim() || session.checkoutCustomerName?.trim() || CART_GUEST_CUSTOMER_NAME;
  return { email, customerName };
}
