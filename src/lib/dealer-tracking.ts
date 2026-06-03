import { prisma } from "@/lib/db";

export type DealerTrackingSourceFilter = "all" | "legacy" | "prepaid";

export type DealerTrackingRow = {
  id: string;
  source: "legacy" | "prepaid";
  code: string;
  serial: string | null;
  status: string;
  type: string;
  planId: string;
  planName: string;
  soldAt: string | null;
  redeemedAt: string | null;
  redeemedBy: string | null;
  isUsed: boolean;
  amountCents: number | null;
};

export function parseLocalDateBoundary(value: string, boundary: "start" | "end"): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number.parseInt(m[1], 10);
  const monthIndex = Number.parseInt(m[2], 10) - 1;
  const day = Number.parseInt(m[3], 10);
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) return null;
  if (boundary === "start") return new Date(year, monthIndex, day, 0, 0, 0, 0);
  return new Date(year, monthIndex, day, 23, 59, 59, 999);
}

function buildSoldAtRange(dateFrom: string, dateTo: string): { gte?: Date; lte?: Date } | undefined {
  const dateWhere: { gte?: Date; lte?: Date } = {};
  if (dateFrom) {
    const parsed = parseLocalDateBoundary(dateFrom, "start");
    if (parsed && !Number.isNaN(parsed.getTime())) dateWhere.gte = parsed;
  }
  if (dateTo) {
    const parsed = parseLocalDateBoundary(dateTo, "end");
    if (parsed && !Number.isNaN(parsed.getTime())) dateWhere.lte = parsed;
  }
  if (dateWhere.gte || dateWhere.lte) return dateWhere;
  return undefined;
}

function matchesUsedFilter(isUsed: string, redeemedAt: Date | null): boolean {
  if (isUsed === "yes") return redeemedAt !== null;
  if (isUsed === "no") return redeemedAt === null;
  return true;
}

async function fetchLegacyRows(
  userId: string,
  filters: {
    type: string;
    planId: string;
    isUsed: string;
    dateFrom: string;
    dateTo: string;
  },
): Promise<DealerTrackingRow[]> {
  const where: {
    activatedById: string;
    type?: string;
    planId?: string;
    redeemedAt?: { not: null } | null;
    activatedAt?: { gte?: Date; lte?: Date };
    prepaidCard?: null;
  } = { activatedById: userId, prepaidCard: null };

  if (filters.type) where.type = filters.type;
  if (filters.planId) where.planId = filters.planId;
  if (filters.isUsed === "yes") where.redeemedAt = { not: null };
  if (filters.isUsed === "no") where.redeemedAt = null;

  const activatedRange = buildSoldAtRange(filters.dateFrom, filters.dateTo);
  if (activatedRange) where.activatedAt = activatedRange;

  const rows = await prisma.voucher.findMany({
    where,
    include: { plan: { select: { id: true, name: true } } },
    orderBy: { activatedAt: "desc" },
    take: 500,
  });

  return rows.map((row) => ({
    id: `legacy-${row.id}`,
    source: "legacy" as const,
    code: row.code,
    serial: null,
    status: row.status,
    type: row.type,
    planId: row.planId,
    planName: row.plan.name,
    soldAt: row.activatedAt?.toISOString() ?? null,
    redeemedAt: row.redeemedAt?.toISOString() ?? null,
    redeemedBy: row.redeemedBy,
    isUsed: row.redeemedAt !== null,
    amountCents: row.creditAmountCents > 0 ? row.creditAmountCents : null,
  }));
}

type PosAuditMeta = {
  purchaseId?: string;
  serial?: string;
  amountCents?: number;
};

async function fetchPrepaidRows(
  userId: string,
  filters: {
    type: string;
    planId: string;
    isUsed: string;
    dateFrom: string;
    dateTo: string;
  },
): Promise<DealerTrackingRow[]> {
  const soldRange = buildSoldAtRange(filters.dateFrom, filters.dateTo);
  const logs = await prisma.auditLog.findMany({
    where: {
      action: "dealer_pos_activation",
      userId,
      ...(soldRange ? { createdAt: soldRange } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const purchaseIds = new Set<string>();
  const parsed: Array<{ logId: string; soldAt: Date; meta: PosAuditMeta }> = [];

  for (const log of logs) {
    let meta: PosAuditMeta = {};
    if (log.metadata) {
      try {
        meta = JSON.parse(log.metadata) as PosAuditMeta;
      } catch {
        meta = {};
      }
    }
    if (typeof meta.purchaseId === "string") purchaseIds.add(meta.purchaseId);
    parsed.push({ logId: log.id, soldAt: log.createdAt, meta });
  }

  const purchases =
    purchaseIds.size > 0
      ? await prisma.cartPurchase.findMany({
          where: { id: { in: Array.from(purchaseIds) } },
          include: {
            plan: { select: { id: true, name: true } },
            voucher: {
              select: {
                id: true,
                code: true,
                status: true,
                type: true,
                planId: true,
                redeemedAt: true,
                redeemedBy: true,
              },
            },
            prepaidCard: { select: { serial: true } },
          },
        })
      : [];

  const purchaseById = new Map(purchases.map((p) => [p.id, p]));
  const rows: DealerTrackingRow[] = [];

  for (const { logId, soldAt, meta } of parsed) {
    const purchase =
      typeof meta.purchaseId === "string" ? purchaseById.get(meta.purchaseId) : undefined;
    const voucher = purchase?.voucher;
    const serial =
      purchase?.prepaidCard?.serial ??
      (typeof meta.serial === "string" ? meta.serial : null);
    const code = serial ?? voucher?.code ?? "—";
    const planId = voucher?.planId ?? purchase?.planId ?? "";
    const planName = purchase?.plan.name ?? "—";
    const type = voucher?.type ?? "prepaid";
    const status = voucher?.status ?? purchase?.status ?? "authorized";
    const redeemedAt = voucher?.redeemedAt ?? purchase?.redeemedAt ?? null;

    if (filters.type && type !== filters.type) continue;
    if (filters.planId && planId !== filters.planId) continue;
    if (!matchesUsedFilter(filters.isUsed, redeemedAt)) continue;

    rows.push({
      id: `prepaid-${logId}`,
      source: "prepaid",
      code,
      serial,
      status,
      type,
      planId,
      planName,
      soldAt: soldAt.toISOString(),
      redeemedAt: redeemedAt?.toISOString() ?? null,
      redeemedBy: voucher?.redeemedBy ?? null,
      isUsed: redeemedAt !== null,
      amountCents:
        typeof meta.amountCents === "number"
          ? meta.amountCents
          : purchase?.amountPaidCents ?? null,
    });
  }

  return rows;
}

export async function getDealerTrackingRows(
  userId: string,
  filters: {
    type?: string;
    planId?: string;
    isUsed?: string;
    dateFrom?: string;
    dateTo?: string;
    source?: string;
  },
): Promise<{ rows: DealerTrackingRow[]; truncated: boolean }> {
  const normalized = {
    type: (filters.type ?? "").trim(),
    planId: (filters.planId ?? "").trim(),
    isUsed: (filters.isUsed ?? "").trim(),
    dateFrom: (filters.dateFrom ?? "").trim(),
    dateTo: (filters.dateTo ?? "").trim(),
    source: (filters.source ?? "all").trim() as DealerTrackingSourceFilter,
  };

  const source: DealerTrackingSourceFilter =
    normalized.source === "legacy" || normalized.source === "prepaid"
      ? normalized.source
      : "all";

  const [legacyRows, prepaidRows] = await Promise.all([
    source === "prepaid" ? Promise.resolve([]) : fetchLegacyRows(userId, normalized),
    source === "legacy" ? Promise.resolve([]) : fetchPrepaidRows(userId, normalized),
  ]);

  const merged = [...legacyRows, ...prepaidRows].sort((a, b) => {
    const at = a.soldAt ? new Date(a.soldAt).getTime() : 0;
    const bt = b.soldAt ? new Date(b.soldAt).getTime() : 0;
    return bt - at;
  });

  const truncated = merged.length > 500;
  return { rows: merged.slice(0, 500), truncated };
}

export async function countLegacyInactiveVouchers(): Promise<number> {
  return prisma.voucher.count({
    where: { status: "inactive", prepaidCard: null },
  });
}
