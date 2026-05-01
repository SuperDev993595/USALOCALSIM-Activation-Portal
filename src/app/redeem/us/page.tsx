"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";
import {
  clearUsRedeemDraft,
  loadUsRedeemDraft,
  REDEEM_RETURN_TO_SUMMARY_FLAG_US,
  saveUsRedeemDraft,
} from "@/lib/redeem-draft";

const AUTO_VALIDATE_LEN = 10;

type PlanPayload = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
};

export default function RedeemUsPage() {
  const t = useTranslations("activateUs");
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState("");
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [voucherStage, setVoucherStage] = useState<"ac1" | "ac2" | "ac3">("ac1");
  const [creditCents, setCreditCents] = useState<number | null>(null);
  const [validatedForCode, setValidatedForCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const validateSeqRef = useRef(0);

  useEffect(() => {
    const code = voucherCode.trim().toUpperCase();
    if (validatedForCode && code !== validatedForCode) {
      setPlan(null);
      setValidatedForCode("");
      setCreditCents(null);
      setVoucherStage("ac1");
      clearUsRedeemDraft();
    }
  }, [voucherCode, validatedForCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(REDEEM_RETURN_TO_SUMMARY_FLAG_US) !== "1") return;
    sessionStorage.removeItem(REDEEM_RETURN_TO_SUMMARY_FLAG_US);
    const d = loadUsRedeemDraft();
    if (!d) return;
    setVoucherCode(d.voucherCode);
    setPlan(d.plan);
    setValidatedForCode(d.validatedForCode);
    setCreditCents(d.creditAmountCents);
    setVoucherStage("ac3");
  }, []);

  async function runValidate(codeRaw: string, seq?: number): Promise<boolean> {
    setError("");
    const code = codeRaw.trim().toUpperCase();
    if (!code) {
      setError(t("enterVoucher"));
      return false;
    }
    setValidating(true);
    try {
      const params = new URLSearchParams({ voucherCode: code, market: "us", clientRedeem: "1" });
      const res = await fetch(`/api/validate?${params}`);
      const data = await res.json();
      if (seq != null && seq !== validateSeqRef.current) return false;
      if (!res.ok) {
        setPlan(null);
        setValidatedForCode("");
        setCreditCents(null);
        clearUsRedeemDraft();
        setError(data.error ?? t("genericError"));
        return false;
      }
      if (data.scenario !== "esim_voucher") {
        setPlan(null);
        setValidatedForCode("");
        setCreditCents(null);
        clearUsRedeemDraft();
        setError(t("notUsEsimVoucher"));
        return false;
      }
      const planPayload = data.plan as PlanPayload;
      const credit = typeof data.credit_amount_cents === "number" ? data.credit_amount_cents : null;
      setPlan(planPayload);
      setValidatedForCode(code);
      setCreditCents(credit);
      saveUsRedeemDraft({
        voucherCode: code,
        validatedForCode: code,
        plan: planPayload,
        creditAmountCents: credit,
      });
      return true;
    } catch {
      if (seq != null && seq !== validateSeqRef.current) return false;
      clearUsRedeemDraft();
      setError(t("genericError"));
      return false;
    } finally {
      setValidating(false);
    }
  }

  useEffect(() => {
    const code = voucherCode.trim().toUpperCase();
    if (code.length < AUTO_VALIDATE_LEN) return;
    const seq = ++validateSeqRef.current;
    const tid = window.setTimeout(() => {
      void runValidate(code, seq);
    }, 500);
    return () => window.clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- voucherCode only
  }, [voucherCode]);

  async function proceedFromStep1() {
    const seq = ++validateSeqRef.current;
    const ok = await runValidate(voucherCode, seq);
    if (ok) setVoucherStage("ac2");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (voucherStage === "ac1") {
      setError("");
      void proceedFromStep1();
    }
  }

  function goToUsContact() {
    if (!plan) return;
    const code = voucherCode.trim().toUpperCase();
    saveUsRedeemDraft({
      voucherCode: code,
      validatedForCode,
      plan,
      creditAmountCents: creditCents,
    });
    router.push("/redeem/us/contact");
  }

  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-subtitle">{t("subtitle")}</p>

          <div className="ui-card mt-8 p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {voucherStage === "ac1" ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 1 of 5</p>
                  <p className="text-xs text-slate-600">{t("autoRecognize")}</p>
                  <div>
                    <label htmlFor="voucher" className="ui-label">
                      {t("voucherLabel")}
                    </label>
                    <input
                      id="voucher"
                      type="text"
                      placeholder={t("voucherPlaceholder")}
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="ui-input"
                      autoComplete="off"
                    />
                    <p className="mt-1 text-xs text-slate-500">{t("validateHint")}</p>
                  </div>
                  {validating ? <p className="text-sm text-slate-600">{t("identifying")}</p> : null}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void proceedFromStep1()}
                      disabled={validating || !voucherCode.trim()}
                      className="btn-secondary min-w-36"
                    >
                      Redeem ➜
                    </button>
                  </div>
                </>
              ) : null}
              {voucherStage === "ac2" && plan ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 2 of 5</p>
                  <div className="space-y-2 rounded-none border border-accent/35 bg-accent/10 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        📶
                      </span>
                      <p className="font-semibold text-slate-900">{t("esimProduct")}</p>
                    </div>
                    <p className="text-slate-600">Voucher type recognized automatically from metadata.</p>
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    <p className="text-slate-600">
                      {t("faceValue")}:{" "}
                      {creditCents != null ? <span className="font-semibold">${(creditCents / 100).toFixed(2)}</span> : "—"}
                    </p>
                    <p className="text-slate-600">
                      {t("dataPack")}: {plan.dataAllowance} · {plan.durationDays} {t("days")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="btn-secondary w-full" onClick={() => setVoucherStage("ac1")} disabled={validating}>
                      ◀ Back
                    </button>
                    <button type="button" className="btn-secondary w-full" onClick={() => setVoucherStage("ac3")} disabled={validating}>
                      Next ➜
                    </button>
                  </div>
                </>
              ) : null}
              {voucherStage === "ac3" && plan ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 3 of 5</p>
                  <div className="space-y-2 rounded-none border border-accent/35 bg-accent/10 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        📶
                      </span>
                      <p className="font-semibold text-slate-900">{t("esimProduct")}</p>
                    </div>
                    <p className="text-slate-600">
                      {t("faceValue")}:{" "}
                      {creditCents != null ? <span className="font-semibold">${(creditCents / 100).toFixed(2)}</span> : "—"}
                    </p>
                    <p className="text-slate-600">{t("step3RegistrationHint")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="btn-secondary w-full" onClick={() => setVoucherStage("ac2")} disabled={validating}>
                      ◀ Back
                    </button>
                    <button type="button" className="btn-secondary w-full" onClick={goToUsContact} disabled={validating}>
                      Next ➜
                    </button>
                  </div>
                </>
              ) : null}
              {error && <p className="text-sm text-red-600">{error}</p>}
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
