import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  if ((session.user as { role?: string }).role !== "admin") return null;
  return session;
}

export async function requireDealerOrAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "dealer") return null;
  return session;
}
