/** Globe mark from voucher artwork (`/images/global.png`). */
export function TierGlobeIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 ${className}`.trim()}>
      <img
        src="/images/global.png"
        alt=""
        aria-hidden
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}
