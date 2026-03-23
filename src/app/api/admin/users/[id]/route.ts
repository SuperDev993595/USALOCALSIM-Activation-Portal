import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";
import { assertAdminAccountPatchAllowed } from "@/lib/user-admin-guard";
import { getRequestClientMeta } from "@/lib/request-meta";

const patchSchema = z
  .object({
    role: z.enum(["admin", "dealer"]).optional(),
    disabled: z.boolean().optional(),
    name: z
      .string()
      .max(120)
      .optional()
      .nullable()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    dealerId: z
      .string()
      .max(120)
      .optional()
      .nullable()
      .transform((v) => (v === "" || v === undefined ? null : v)),
  })
  .strict();

export async function PATCH(
  req: Request,
  context: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const guard = await assertAdminAccountPatchAllowed(id, {
    role: body.role,
    disabled: body.disabled,
  });
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 400 });
  }

  const data: {
    role?: string;
    disabled?: boolean;
    name?: string | null;
    dealerId?: string | null;
  } = {};

  if (body.role !== undefined) data.role = body.role;
  if (body.disabled !== undefined) data.disabled = body.disabled;
  if (body.name !== undefined) data.name = body.name;
  if (body.dealerId !== undefined) data.dealerId = body.dealerId;

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        dealerId: true,
        disabled: true,
        createdAt: true,
      },
    });

    const { ip, userAgent } = getRequestClientMeta(req);
    await prisma.auditLog.create({
      data: {
        action: "user_update",
        userId: session.user.id,
        metadata: JSON.stringify({
          targetUserId: id,
          fields: Object.keys(body),
          ip,
          userAgent,
        }),
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
