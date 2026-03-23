import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing voucher id" }, { status: 400 });
  }

  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: { activationRequest: { select: { id: true } } },
  });

  if (!voucher) {
    return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  }

  if (voucher.status !== "inactive") {
    return NextResponse.json(
      { error: "Only inactive vouchers can be removed. Activated or redeemed codes must stay for records." },
      { status: 400 },
    );
  }

  if (voucher.activationRequest) {
    return NextResponse.json(
      { error: "This voucher is linked to an activation request and cannot be deleted." },
      { status: 409 },
    );
  }

  await prisma.voucher.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
