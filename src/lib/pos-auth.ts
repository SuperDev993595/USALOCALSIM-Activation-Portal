import { timingSafeEqual } from "crypto";

/** Shared secret for `POST /api/pos/activate` (retailer / POS integrator). */
export function verifyPosApiKey(req: Request): boolean {
  const expected = process.env.POS_API_KEY?.trim();
  if (!expected) return false;
  const header = req.headers.get("authorization")?.trim() ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = req.headers.get("x-pos-api-key")?.trim() ?? "";
  const provided = bearer || alt;
  if (!provided) return false;
  try {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
