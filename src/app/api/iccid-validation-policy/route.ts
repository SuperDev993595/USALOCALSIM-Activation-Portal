import { NextResponse } from "next/server";
import { getIccidStrictDatabaseCheck } from "@/lib/iccid-validation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public hint for activation UI (strict vs relaxed ICCID rules). */
export async function GET() {
  const strictDatabaseCheck = await getIccidStrictDatabaseCheck(prisma);
  return NextResponse.json({ strictDatabaseCheck });
}
