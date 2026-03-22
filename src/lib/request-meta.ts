/** Client IP and User-Agent from common proxy headers (for audit logs). */
export function getRequestClientMeta(req: Request): { ip: string | null; userAgent: string | null } {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;
  return { ip, userAgent };
}
