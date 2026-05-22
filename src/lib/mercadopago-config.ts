/** Server-side Mercado Pago credentials (no Node-only deps — safe to import from client feature flags). */
export function getMercadoPagoAccessToken(): string | null {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  return t || null;
}

/** UI flag only (`NEXT_PUBLIC_*`). Use on client components. */
export function isCartMercadoPagoUiEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_CART_MERCADOPAGO_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return flag === "true" || flag === "1";
}
