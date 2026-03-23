import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type Db = Pick<PrismaClient, "activationRequest">;

export function normalizeIccid(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/\s/g, "");
}

/** True if any request (pending or completed) already uses this ICCID. */
export async function iccidHasExistingActivation(iccid: string, db: Db = prisma): Promise<boolean> {
  const n = normalizeIccid(iccid);
  if (!n) return false;
  const row = await db.activationRequest.findFirst({
    where: { iccid: n },
    select: { id: true },
  });
  return !!row;
}
