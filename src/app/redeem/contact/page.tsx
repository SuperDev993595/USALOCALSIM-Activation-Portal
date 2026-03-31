"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";
import {
  loadIntlRedeemDraft,
  saveIntlRedeemDraft,
  REDEEM_RETURN_TO_SUMMARY_FLAG_INTL,
  type IntlRedeemDraft,
} from "@/lib/redeem-draft";
import { isRedeemEmailValid, isTravelDateFilled, isVoucherEmailTravelStepComplete } from "@/lib/redeem-eligibility";

export default function RedeemContactPage() {
  const router = useRouter();
  const t = useTranslations("activate");
  const tf = useTranslations("activate.flow");
  const [draft, setDraft] = useState<IntlRedeemDraft | null>(null);
  const [email, setEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");

  useEffect(() => {
    const d = loadIntlRedeemDraft();
    if (!d) {
      router.replace("/redeem");
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
    const next: IntlRedeemDraft = {
      ...draft,
      email: email.trim(),
      travelDate,
    };
    saveIntlRedeemDraft(next);
    router.push("/redeem/device");
  }

  function handleBack() {
    sessionStorage.setItem(REDEEM_RETURN_TO_SUMMARY_FLAG_INTL, "1");
    router.push("/redeem");
  }

  if (!draft) return null;

  return (
    <div className="public-site flex h-screen flex-col overflow-hidden">
      <SiteHeader />
      <main className="public-main ui-main-scrollbar flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-2xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">{t("stepLabel")}</p>
          <h1 className="page-hero-title">{tf("titleRedeem")}</h1>
          <p className="page-hero-subtitle">{tf("subtitleRedeem")}</p>

          <div className="ui-card mt-8 p-6">
            <form className="space-y-4" onSubmit={handleContinue}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 4 of 5</p>
              <p className="text-xs text-slate-600">{tf("emailTravelStepHint")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email-redeem-contact" className="ui-label">
                    {t("emailLabel")}
                  </label>
                  <input
                    id="email-redeem-contact"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ui-input"
                    required
                  />
                  {errors?.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
                </div>
                <div>
                  <label htmlFor="travel-redeem-contact" className="ui-label">
                    {tf("travelDate")}
                  </label>
                  <input
                    id="travel-redeem-contact"
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="ui-input"
                    required
                  />
                  {errors?.travelDate ? <p className="mt-1 text-xs text-red-600">{errors.travelDate}</p> : null}
                </div>
              </div>
              <p className="text-xs text-slate-500">{tf("noPaymentFooter")}</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="btn-secondary w-full" onClick={handleBack}>
                  ◀ Back
                </button>
                <button type="submit" className="btn-primary w-full" disabled={!ready}>
                  {tf("continueToDeviceDetails")} ➜
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
