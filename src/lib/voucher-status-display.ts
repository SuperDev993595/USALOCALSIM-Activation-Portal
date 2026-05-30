import { VOUCHER_STATUS, type VoucherStatus } from "@/lib/voucher-status";

/** Client-facing admin labels (feedback 2026-05-28 — Pending until POS, Active when redeemable). */
export type VoucherAdminDisplayStatus = "Pending" | "Active" | "Redeemed" | "Other";

export function voucherAdminDisplayStatus(voucher: {
  status: string;
  paymentStatus?: boolean;
}): VoucherAdminDisplayStatus {
  const s = voucher.status.toLowerCase();
  if (s === VOUCHER_STATUS.REDEEMED) return "Redeemed";
  if (s === VOUCHER_STATUS.ELIGIBLE || s === VOUCHER_STATUS.ACTIVATED) return "Active";
  if (s === VOUCHER_STATUS.INACTIVE) return "Pending";
  return "Other";
}

export function voucherAdminStatusBadge(voucher: {
  status: string;
  paymentStatus?: boolean;
}): { label: string; badge: string; dot: string; dbStatus: string } {
  const display = voucherAdminDisplayStatus(voucher);
  const dbStatus = voucher.status;
  const styles: Record<VoucherAdminDisplayStatus, { badge: string; dot: string; label: string }> = {
    Pending: {
      badge: "border-amber-300 bg-amber-50 text-amber-900",
      dot: "bg-amber-500",
      label: "Pending",
    },
    Active: {
      badge: "border-emerald-300 bg-emerald-50 text-emerald-900",
      dot: "bg-emerald-600",
      label: "Active",
    },
    Redeemed: {
      badge: "border-violet-300 bg-violet-50 text-violet-900",
      dot: "bg-violet-500",
      label: "Redeemed",
    },
    Other: {
      badge: "border-slate-300 bg-slate-50 text-slate-800",
      dot: "bg-slate-500",
      label: dbStatus,
    },
  };
  const style = styles[display];
  return { ...style, dbStatus };
}

export function isVoucherStatus(value: string): value is VoucherStatus {
  return Object.values(VOUCHER_STATUS).includes(value as VoucherStatus);
}
