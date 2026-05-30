import { paymentMethodsNote } from "@/lib/redeem-config";

export function PaymentMethodsNote({ className = "" }: { className?: string }) {
  const note = paymentMethodsNote();
  if (!note) return null;
  return (
    <p
      className={`rounded border border-white/10 bg-white/5 px-3 py-2 text-center text-xs leading-relaxed text-slate-300 ${className}`}
      role="note"
    >
      {note}
    </p>
  );
}
