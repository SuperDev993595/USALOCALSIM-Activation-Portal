"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import {
  CART_FLOW_CLASS,
  CART_INPUT_CLASS,
  CART_PANEL_CLASS,
  CART_PRIMARY_BUTTON_CLASS,
} from "@/lib/cart-panel";

export function CartPhoneVerifyClient({
  resumeQuery,
  prepaidSerialFromQr,
  needSerialBanner,
  needVoucherCreditBanner,
}: {
  resumeQuery: string | null;
  prepaidSerialFromQr?: string | null;
  needSerialBanner?: boolean;
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
  const autoLinking =
    Boolean(prepaidSerialFromQr?.trim()) &&
    !needSerialBanner &&
    !needVoucherCreditBanner &&
    loading &&
    !redirectingToRedeem;

  const stepHints = [
    { key: "phase1NavStep1" as const, active: true },
    { key: "phase1NavStep2" as const, active: false },
    { key: "phase1NavStep4" as const, active: false },
  ];

  return (
    <div className={CART_FLOW_CLASS}>
      <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout`}>
        <CartPhase1StepNav currentStep={1} embedded />

        <header className="cart-flow-header cart-flow-header--accent">
          <p className="cart-flow-eyebrow">{t("phase1NavStep1")}</p>
          <h1 className="cart-flow-title">{t("linkCardTitle")}</h1>
          <p className="cart-flow-subtitle">{t("linkCardSubtitle")}</p>
          <div className="cart-flow-steps-hint mt-4" aria-hidden>
            {stepHints.map(({ key, active }) => (
              <span key={key} className={`cart-flow-steps-hint-item ${active ? "cart-flow-steps-hint-item--active" : ""}`}>
                {t(key)}
              </span>
            ))}
          </div>
        </header>

        <div className="cart-flow-body space-y-4">
          {resumeBanner ? (
            <CartNotice
              variant={resumeQuery === "pending" ? "info" : "warning"}
              action={
                resumeQuery === "pending" ? (
                  <Link href="/redeem/enter" className={`${CART_PRIMARY_BUTTON_CLASS} !min-h-10 text-center`}>
                    {t("resumeRedeemCta")}
                  </Link>
                ) : undefined
              }
            >
              {resumeBanner}
            </CartNotice>
          ) : null}

          {needVoucherCreditBanner ? (
            <CartNotice variant="warning">{t("needVoucherCreditBanner")}</CartNotice>
          ) : needSerialBanner ? (
            <CartNotice variant="warning">{t("needSerialBanner")}</CartNotice>
          ) : null}

          {!needSerialBanner && !needVoucherCreditBanner && prepaidSerialFromQr?.trim() && redirectingToRedeem ? (
            <CartNotice variant="info">{t("alreadyPaidSerialBanner")}</CartNotice>
          ) : null}

          {!needSerialBanner && !needVoucherCreditBanner && prepaidSerialFromQr?.trim() && !redirectingToRedeem && !loading ? (
            <CartNotice variant="success">{t("serialQrBanner")}</CartNotice>
          ) : null}

          {autoLinking ? (
            <div className="cart-flow-loading" role="status" aria-live="polite">
              <span className="cart-flow-spinner" aria-hidden />
              {t("phase1Linking")}
            </div>
          ) : null}

          {showManualSerialForm && !needVoucherCreditBanner ? (
            <section className="cart-flow-block" aria-labelledby="cart-serial-heading">
              <h2 id="cart-serial-heading" className="cart-flow-block-title">
                {t("phase1SerialHeading")}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">{t("phase1SerialInstructions")}</p>
              <div className="cart-flow-field">
                <label className="cart-flow-field-label" htmlFor="cart-serial">
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
                  className={CART_INPUT_CLASS}
                  placeholder={t("phase1SerialPlaceholder")}
                />
              </div>
              {error ? <CartNotice variant="error">{error}</CartNotice> : null}
              <button
                type="button"
                className={CART_PRIMARY_BUTTON_CLASS}
                disabled={loading || !manualSerial.trim()}
                onClick={() => void submitManualSerial()}
              >
                {loading ? t("phase1Linking") : t("phase1Continue")}
              </button>
            </section>
          ) : (
            !showManualSerialForm && error ? <CartNotice variant="error">{error}</CartNotice> : null
          )}
        </div>

        <footer className="cart-flow-footer">
          <Link href="/redeem/enter" className="cart-flow-footer-link">
            {t("backRedeem")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
