/** Statue of Liberty from voucher artwork (`/images/liberty.png`, transparent white lines). */
export function StatueOfLibertyIcon({ className = "h-10 w-10" }: { className?: string }) {  return (
    <span className={`inline-flex shrink-0 ${className}`.trim()}>
      <img
        src="/images/liberty.png"
        alt=""
        aria-hidden
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}
