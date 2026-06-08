import type { ReactNode } from "react";

/** Dark navy redeem shell + faint map-02 — /redeem/enter, /redeem, /redeem/three-uk. */
export function RedeemPageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="public-site public-site--redeem relative isolate flex min-h-screen flex-col overflow-x-hidden">
      <div className="redeem-bg-map pointer-events-none fixed left-1/2 z-[2] -translate-x-1/2" aria-hidden />
      <div className="redeem-bg-aurora pointer-events-none fixed inset-x-0 top-0 z-[1] h-svh max-h-svh w-full" aria-hidden />
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </div>
    </div>
  );
}
