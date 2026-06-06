import type { ReactNode } from "react";

export function RedeemPageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="public-site relative isolate flex min-h-screen flex-col text-slate-900">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-slate-300 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/home-banner-01.webp)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-slate-900/50 via-slate-900/35 to-slate-900/55"
        aria-hidden
      />
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </div>
    </div>
  );
}
