import { voucherAdminStatusBadge } from "@/lib/voucher-status-display";

export function VoucherAdminStatusBadge({
  status,
  paymentStatus,
}: {
  status: string;
  paymentStatus: boolean;
}) {
  const style = voucherAdminStatusBadge({ status, paymentStatus });
  return (
    <span
      className={`badge inline-flex items-center gap-1.5 whitespace-nowrap border font-semibold ${style.badge}`}
      title={`DB status: ${style.dbStatus}${paymentStatus ? " · paid" : ""}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  );
}
