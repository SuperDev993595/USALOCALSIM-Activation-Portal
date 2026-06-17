/** Extract SKU from legacy seeded plan names like `[TM-UNL-30D] T-Mobile … (eSIM)`. */
export function parseSkuFromPlanName(name: string): string | null {
  const m = name.trim().match(/^\[([^\]]+)\]/);
  return m?.[1]?.trim().toUpperCase() ?? null;
}

/** Resolve catalog SKU from DB column or plan title (for redeem quote rows). */
export function resolvePlanSkuFromRow(row: {
  sku?: string | null;
  name: string;
}): string {
  const fromColumn = row.sku?.trim().toUpperCase();
  if (fromColumn) return fromColumn;

  const fromBrackets = parseSkuFromPlanName(row.name);
  if (fromBrackets) return fromBrackets;

  const tmDays = row.name.match(/T-Mobile\s+Unlimited\s*[—-]\s*(\d+)\s*days/i);
  if (tmDays) return `TM-UNL-${tmDays[1]}D`;

  const linkupGb = row.name.match(/LINKUP\s*&\s*AT&T\s*[—-]\s*(\d+)\s*GB/i);
  if (linkupGb) return `ATT-LIM-${linkupGb[1]}GB`;

  return "";
}

export function normalizePlanSku(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function planTypeLabel(planType: string): string {
  return planType === "esim" ? "eSIM" : "Physical SIM";
}

/** Plan title for redeem/cart lists — omits trailing (Physical SIM) / (eSIM). */
export function planListDisplayName(name: string): string {
  return name.trim().replace(/\s*\((?:Physical SIM|eSIM)\)\s*$/i, "");
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
