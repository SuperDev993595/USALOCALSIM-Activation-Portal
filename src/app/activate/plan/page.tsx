"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Plan = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  originalPriceCents: number;
};

export default function ActivatePlanPage() {
  const searchParams = useSearchParams();
  const iccid = searchParams.get("iccid") ?? "";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!iccid) {
      setError("Missing ICCID");
      setLoading(false);
      return;
    }
    fetch(`/api/validate?iccid=${encodeURIComponent(iccid)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.plans) setPlans(data.plans);
        else setError(data.error ?? "Failed to load plans");
      })
      .catch(() => setError("Failed to load plans"))
      .finally(() => setLoading(false));
  }, [iccid]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-gray-600">Loading plans…</p>
      </main>
    );
  }

  if (error || !plans.length) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center">
        <p className="text-red-600">{error || "No plans available."}</p>
        <Link href="/activate" className="mt-4 text-blue-600 hover:underline">← Back to activation</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">Choose your data plan</h1>
        <p className="mt-2 text-gray-600 text-sm">
          Enter your ICCID to choose your data plan and pay via Credit Card or Crypto. Your initial SIM cost will be discounted.
        </p>
        <p className="mt-2 text-sm text-gray-500">ICCID: {iccid}</p>

        <div className="mt-6 space-y-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/activate/checkout?iccid=${encodeURIComponent(iccid)}&planId=${encodeURIComponent(plan.id)}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-500 hover:bg-blue-50/50"
            >
              <div className="font-medium text-gray-900">{plan.name}</div>
              <div className="text-sm text-gray-600">
                {plan.dataAllowance} · {plan.durationDays} days
              </div>
              <div className="mt-2 text-lg font-semibold text-blue-600">
                ${(plan.priceCents / 100).toFixed(2)}
                {plan.originalPriceCents > plan.priceCents && (
                  <span className="ml-2 text-sm font-normal text-gray-500 line-through">
                    ${(plan.originalPriceCents / 100).toFixed(2)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-center">
          <Link href="/activate" className="text-sm text-blue-600 hover:underline">← Back to activation</Link>
        </p>
      </div>
    </main>
  );
}
