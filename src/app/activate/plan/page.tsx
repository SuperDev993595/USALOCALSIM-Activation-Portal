"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function ActivatePlanPage() {
  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 items-center justify-center px-6 py-16">
        <div className="ui-card w-full max-w-lg p-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">Plan page moved</h1>
          <p className="mt-3 text-sm text-muted">
            The old ICCID plan page is no longer used. Please continue from the new Buy Plan flow.
          </p>
          <p className="mt-6">
            <Link href="/activate/buy-plan" className="btn-primary inline-block px-6 py-2.5">
              Go to Buy Plan
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
