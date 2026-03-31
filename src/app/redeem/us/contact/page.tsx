"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";
import {
  loadUsRedeemDraft,
  REDEEM_RETURN_TO_SUMMARY_FLAG_US,
  saveUsRedeemDraft,
  type UsRedeemDraft,
} from "@/lib/redeem-draft";
import { isRedeemEmailValid, isTravelDateFilled, isVoucherEmailTravelStepComplete } from "@/lib/redeem-eligibility";

export default function RedeemUsContactPage() {
  const router = useRouter();
  const t = useTranslations("activateUs");
  const [draft, setDraft] = useState<UsRedeemDraft | null>(null);
  const [email, setEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");

  useEffect(() => {
    const d = loadUsRedeemDraft();
    if (!d) {
      router.replace("/redeem/us");
      return;
    }
    setDraft(d);
    if (d.email) setEmail(d.email);
    if (d.travelDate) setTravelDate(d.travelDate);
  }, [router]);

  const ready = useMemo(
    () =>
      Boolean(
        draft &&
          isVoucherEmailTravelStepComplete({
            voucherCode: draft.voucherCode,
            validatedForCode: draft.validatedForCode,
            voucherValidated: true,
            email,
            travelDate,
          })
      ),
    [draft, email, travelDate]
  );

  const errors = useMemo(() => {
    if (!draft) return null;
    return {
      email: isRedeemEmailValid(email) ? "" : "Enter a valid email address.",
      travelDate: isTravelDateFilled(travelDate) ? "" : "Select a travel date.",
    };
  }, [draft, email, travelDate]);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !ready) return;
    saveUsRedeemDraft({
      ...draft,
      email: email.trim(),
      travelDate,
    });
    router.push("/redeem/us/device");
  }

  function handleBack() {
    sessionStorage.setItem(REDEEM_RETURN_TO_SUMMARY_FLAG_US, "1");
    router.push("/redeem/us");
  }

  if (!draft) return null;

  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-subtitle">{t("subtitle")}</p>

          <div className="ui-card mt-8 p-6">
            <form className="space-y-4" onSubmit={handleContinue}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 4 of 5</p>
              <p className="text-xs text-slate-600">{t("emailTravelStepHint")}</p>
              <div>
                <label htmlFor="email-us-contact" className="ui-label">
                  {t("emailLabel")}
                </label>
                <input
                  id="email-us-contact"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ui-input"
                  required
                />
                {errors?.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
              </div>
              <div>
                <label htmlFor="travel-us-contact" className="ui-label">
                  {t("travelDate")}
                </label>
                <input
                  id="travel-us-contact"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="ui-input"
                  required
                />
                {errors?.travelDate ? <p className="mt-1 text-xs text-red-600">{errors.travelDate}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="btn-secondary w-full" onClick={handleBack}>
                  ◀ Back
                </button>
                <button type="submit" className="btn-primary w-full" disabled={!ready}>
                  {t("continueToDeviceDetails")} ➜
                </button>
              </div>
            </form>
          </div>

          <p className="mt-4 text-center text-sm">
            <Link href="/redeem" className="link-accent">
              {t("globalActivationLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
