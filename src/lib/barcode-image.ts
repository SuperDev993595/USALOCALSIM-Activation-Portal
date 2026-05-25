const ORCA_BASE = "https://barcode.orcascan.com/";

export type OrcaBarcodeType = "code128" | "qr";

export function orcaBarcodeImageUrl(opts: {
  type: OrcaBarcodeType;
  data: string;
  padding?: number;
  fontsize?: number;
  scale?: number;
}): string {
  const u = new URL(ORCA_BASE);
  u.searchParams.set("type", opts.type);
  u.searchParams.set("data", opts.data);
  if (opts.padding != null) u.searchParams.set("padding", String(opts.padding));
  if (opts.fontsize != null) u.searchParams.set("fontsize", String(opts.fontsize));
  if (opts.scale != null) u.searchParams.set("scale", String(opts.scale));
  return u.toString();
}

export function appBaseUrlFromEnv(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
