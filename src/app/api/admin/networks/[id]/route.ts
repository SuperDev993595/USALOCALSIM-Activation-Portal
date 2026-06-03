import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const patchSchema = z
  .object({
    slug: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9_]+$/)
      .optional(),
    name: z.string().min(1).max(120).optional(),
    displayOrder: z.number().int().min(0).max(9999).optional(),
    active: z.boolean().optional(),
  })
  .strict();

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const existing = await prisma.network.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Network not found" }, { status: 404 });

  try {
    const network = await prisma.network.update({
      where: { id },
      data: {
        ...(body.slug !== undefined ? { slug: body.slug.trim().toLowerCase() } : {}),
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.displayOrder !== undefined ? { displayOrder: body.displayOrder } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "admin_network_updated",
        userId: session.user.id,
        metadata: JSON.stringify({ networkId: id, slug: network.slug, active: network.active }),
      },
    });
    return NextResponse.json(network);
  } catch {
    return NextResponse.json({ error: "Could not update network. Slug may already exist." }, { status: 409 });
  }
}
