import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_]+$/, "Slug: lowercase letters, numbers, underscores only"),
  name: z.string().min(1).max(120),
  displayOrder: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const networks = await prisma.network.findMany({
    orderBy: { displayOrder: "asc" },
    select: { id: true, slug: true, name: true, active: true, displayOrder: true },
  });
  return NextResponse.json(networks);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body: slug, name, displayOrder?, active?" }, { status: 400 });
  }

  try {
    const network = await prisma.network.create({
      data: {
        slug: body.slug.trim().toLowerCase(),
        name: body.name.trim(),
        displayOrder: body.displayOrder ?? 0,
        active: body.active ?? true,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "admin_network_created",
        userId: session.user.id,
        metadata: JSON.stringify({ networkId: network.id, slug: network.slug }),
      },
    });
    return NextResponse.json(network);
  } catch {
    return NextResponse.json({ error: "Could not create network. Slug may already exist." }, { status: 409 });
  }
}
