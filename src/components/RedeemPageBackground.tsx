import type { ReactNode } from "react";

/** Premium redeem cockpit — navy gradient, map texture, ambient voucher card art. */
export function RedeemPageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="public-site public-site--redeem relative isolate flex min-h-screen flex-col overflow-x-hidden">
      <div className="redeem-bg-aurora pointer-events-none fixed inset-0 z-[1] h-svh max-h-svh w-full" aria-hidden />
      <img
        src="/images/map-02.webp"
        alt=""
        width={1188}
        height={970}
        className="redeem-bg-map pointer-events-none fixed z-[2]"
        aria-hidden
      />
      <div className="redeem-bg-cards pointer-events-none fixed inset-0 z-[3]" aria-hidden>
        <img
          src="/images/card-design-front.webp"
          alt=""
          width={514}
          height={820}
          className="redeem-bg-card redeem-bg-card--front"
          decoding="async"
          fetchPriority="low"
        />
        <img
          src="/images/card-design-back.webp"
          alt=""
          width={484}
          height={820}
          className="redeem-bg-card redeem-bg-card--back"
          decoding="async"
          fetchPriority="low"
        />
      </div>
      <div className="redeem-bg-vignette pointer-events-none fixed inset-0 z-[4]" aria-hidden />
      <div className="redeem-bg-scrim pointer-events-none fixed inset-0 z-[5]" aria-hidden />
      <div className="redeem-bg-accent pointer-events-none fixed inset-x-0 top-0 z-[6] h-[3px]" aria-hidden />
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </div>
    </div>
  );
}
