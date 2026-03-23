import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";
import { getRequestClientMeta } from "@/lib/request-meta";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "dealer"]),
  name: z.string().optional(),
  dealerId: z
    .string()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json(users);
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
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const hashed = await hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: body.role,
      name: body.name?.trim() || null,
      dealerId: body.dealerId,
    },
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
      action: "user_create",
      userId: session.user.id,
      metadata: JSON.stringify({ createdUserId: user.id, email: user.email, ip, userAgent }),
    },
  });

  return NextResponse.json(user);
}
