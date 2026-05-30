/** Extract SKU from legacy seeded plan names like `[TM-UNL-30D] T-Mobile … (eSIM)`. */
export function parseSkuFromPlanName(name: string): string | null {
  const m = name.trim().match(/^\[([^\]]+)\]/);
  return m?.[1]?.trim().toUpperCase() ?? null;
}

export function normalizePlanSku(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function planTypeLabel(planType: string): string {
  return planType === "esim" ? "eSIM" : "Physical SIM";
}

/** Human-readable plan title (SKU stored separately). */
export function planCatalogDisplayName(
  name: string,
  planType: "physical_sim" | "esim",
): string {
  const fmt = planTypeLabel(planType);
  const base = name.trim();
  if (base.toLowerCase().endsWith(`(${fmt.toLowerCase()})`)) return base;
  return `${base} (${fmt})`;
}
