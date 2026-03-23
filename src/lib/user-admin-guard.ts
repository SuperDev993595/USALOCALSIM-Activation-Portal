import { prisma } from "./db";

/**
 * Admin accounts cannot be demoted to dealer or disabled (no one can "remove" admin access via the API).
 */
export async function assertAdminAccountPatchAllowed(
  targetUserId: string,
  patch: { role?: "admin" | "dealer"; disabled?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (patch.role === undefined && patch.disabled === undefined) {
    return { ok: true };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { ok: false, error: "User not found" };

  if (target.role === "admin") {
    if (patch.role === "dealer") {
      return { ok: false, error: "Admin accounts cannot be demoted." };
    }
    if (patch.disabled === true) {
      return { ok: false, error: "Admin accounts cannot be disabled." };
    }
  }

  return { ok: true };
}
