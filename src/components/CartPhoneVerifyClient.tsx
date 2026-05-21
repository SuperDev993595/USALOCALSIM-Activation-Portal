"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CartPhase1StepNav, cartPhase1BackButtonClass } from "@/components/CartPhase1StepNav";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";

export function CartPhoneVerifyClient({
  resumeQuery,
  prepaidSerialFromQr,
  needSerialBanner,
  needVoucherCreditBanner,
}: {
  resumeQuery: string | null;
  /** From physical card QR (`/cart?serial=` or `/pay?serial=`). */
  prepaidSerialFromQr?: string | null;
  /** Opened /cart after hitting payment step without a linked card (e.g. /cart/plans redirect). */
  needSerialBanner?: boolean;
  /** Voucher has no `credit_amount` — Phase 1 does not use plan list price. */
  needVoucherCreditBanner?: boolean;
}) {
  const t = useTranslations("cart");
  const router = useRouter();
  const [manualSerial, setManualSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectingToRedeem, setRedirectingToRedeem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStartedRef = useRef(false);

  const resumeBanner = useMemo(() => {
    if (!resumeQuery) return null;
    if (resumeQuery === "pending") return t("resumePendingBanner");
    if (resumeQuery === "invalid" || resumeQuery === "missing") return t("resumeInvalidBanner");
    return null;
  }, [resumeQuery, t]);

  const goPlans = useCallback(() => {
    router.push("/cart/plans");
    router.refresh();
  }, [router]);

  const startSession = useCallback(
    async (serial: string) => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/cart/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prepaidSerial: serial }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          redirect?: string;
          alreadyPaid?: boolean;
        };
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : t("errorGeneric"));
          return;
        }
        if (typeof data.redirect === "string" && data.redirect.startsWith("/redeem")) {
          setRedirectingToRedeem(true);
          router.push(data.redirect);
          router.refresh();
          return;
        }
        goPlans();
      } finally {
        setLoading(false);
      }
    },
    [goPlans, t],
  );

  useEffect(() => {
    const s = prepaidSerialFromQr?.trim();
    if (!s || needSerialBanner || needVoucherCreditBanner) return;
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startSession(s);
  }, [needSerialBanner, needVoucherCreditBanner, prepaidSerialFromQr, startSession]);

  async function submitManualSerial() {
    const s = manualSerial.trim();
    if (!s) return;
    await startSession(s);
  }

  const showManualSerialForm = !prepaidSerialFromQr?.trim() || needSerialBanner;

  return (
    <div className="ui-card mx-auto w-full max-w-md p-6 sm:p-8">
      <CartPhase1StepNav currentStep={1} />
      <div className="flex items-start gap-3">
        <Link href="/redeem" className={cartPhase1BackButtonClass} aria-label={t("backRedeemAria")}>
          <BackChevronIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("subtitle")}</p>
        </div>
      </div>
      {resumeBanner ? (
        <p className="mt-4 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{resumeBanner}</p>
      ) : null}
      {needVoucherCreditBanner ? (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
          {t("needVoucherCreditBanner")}
        </p>
      ) : needSerialBanner ? (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
          {t("needSerialBanner")}
        </p>
      ) : null}
      {!needSerialBanner && !needVoucherCreditBanner && prepaidSerialFromQr?.trim() && redirectingToRedeem ? (
        <p className="mt-4 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          {t("alreadyPaidSerialBanner")}
        </p>
      ) : null}
      {!needSerialBanner && !needVoucherCreditBanner && prepaidSerialFromQr?.trim() && !redirectingToRedeem ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {t("serialQrBanner")}
        </p>
      ) : null}

      {showManualSerialForm && !needVoucherCreditBanner ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">{t("phase1SerialInstructions")}</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="cart-serial">
              {t("phase1SerialLabel")}
            </label>
            <input
              id="cart-serial"
              autoComplete="off"
              value={manualSerial}
              onChange={(e) => setManualSerial(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (loading || !manualSerial.trim()) return;
                void submitManualSerial();
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
              placeholder={t("phase1SerialPlaceholder")}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
            disabled={loading || !manualSerial.trim()}
            onClick={() => void submitManualSerial()}
          >
            {loading ? t("phase1Linking") : t("phase1Continue")}
          </button>
        </div>
      ) : (
        !showManualSerialForm && error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null
      )}

      {prepaidSerialFromQr?.trim() && !needSerialBanner && !needVoucherCreditBanner && loading ? (
        <p className="mt-4 text-sm text-slate-600">{t("phase1Linking")}</p>
      ) : null}
    </div>
  );
}
