"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Scenario = "combo" | "esim_voucher" | "sim_only" | null;

export default function ActivatePage() {
  const t = useTranslations("activate");
  const router = useRouter();
  const [iccid, setIccid] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"input" | "email">("input");
  const [scenario, setScenario] = useState<Scenario>(null);
  const [planId, setPlanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationDialogMessage, setValidationDialogMessage] = useState("");

  async function handleValidate() {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (iccid.trim()) params.set("iccid", iccid.trim().replace(/\s/g, ""));
      if (voucherCode.trim()) params.set("voucherCode", voucherCode.trim().toUpperCase());
      const res = await fetch(`/api/validate?${params}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Validation failed";
        if (data.code === "ICCID_ALREADY_USED" || msg.toLowerCase().includes("iccid")) {
          setValidationDialogMessage(msg);
          setValidationDialogOpen(true);
          setError("");
        } else {
          setError(msg);
        }
        setLoading(false);
        return;
      }
      if (data.scenario === "sim_only") {
        router.push(`/activate/checkout?iccid=${encodeURIComponent(iccid.trim().replace(/\s/g, ""))}`);
        return;
      }
      setScenario(data.scenario);
      setPlanId(data.plan.id);
      setStep("email");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          email: email.trim(),
          voucherCode: voucherCode.trim().toUpperCase(),
          planId,
          iccid: scenario === "combo" ? iccid.trim().replace(/\s/g, "") : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Submission failed";
        if (res.status === 409 && msg.toLowerCase().includes("iccid")) {
          setValidationDialogMessage(msg);
          setValidationDialogOpen(true);
          setError("");
        } else {
          setError(msg);
        }
        setLoading(false);
        return;
      }
      router.push("/activate/success");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader />
      <main className="ui-main-scrollbar flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-md">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">{t("stepLabel")}</p>
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-subtitle">{t("subtitle")}</p>

          <div className="ui-card mt-8 p-6">
            {step === "input" ? (
              <>
                <ul className="mb-4 space-y-3 text-sm text-muted">
                  <li>
                    <strong className="text-white">{t("option1Title")}</strong>
                    <br />
                    <span className="text-muted-dim">{t("option1Desc")}</span>
                  </li>
                  <li>
                    <strong className="text-white">{t("option2Title")}</strong>
                    <br />
                    <span className="text-muted-dim">{t("option2Desc")}</span>
                  </li>
                  <li>
                    <strong className="text-white">{t("option3Title")}</strong>
                    <br />
                    <span className="text-muted-dim">{t("option3Desc")}</span>
                  </li>
                </ul>
                <p className="mb-4 text-xs uppercase tracking-wide text-muted-dim">{t("optionHint")}</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="iccid" className="ui-label">
                      {t("iccidLabel")}
                    </label>
                    <input
                      id="iccid"
                      type="text"
                      placeholder={t("iccidPlaceholder")}
                      value={iccid}
                      onChange={(e) => setIccid(e.target.value)}
                      className="ui-input"
                    />
                  </div>
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
                    />
                  </div>
                </div>
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={loading || (!iccid.trim() && !voucherCode.trim())}
                  className="btn-primary mt-4 w-full"
                >
                  {loading ? t("checking") : t("continue")}
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="mb-4 text-sm text-muted">
                  {scenario === "combo" ? t("comboEmailHint") : t("esimEmailHint")}
                </p>
                <div>
                  <label htmlFor="email" className="ui-label">
                    {t("emailLabel")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ui-input"
                  />
                </div>
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("input");
                      setScenario(null);
                      setError("");
                    }}
                    className="btn-secondary flex-1"
                  >
                    {t("back")}
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-[2]">
                    {loading ? t("submitting") : t("submit")}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-center">
            <Link href="/" className="link-accent text-sm">
              {t("backToHome")}
            </Link>
          </p>
        </div>
      </main>
      <ConfirmDialog
        open={validationDialogOpen}
        title="ICCID validation required"
        confirmLabel="OK"
        cancelLabel="Close"
        initialFocus="confirm"
        onConfirm={() => setValidationDialogOpen(false)}
        onCancel={() => setValidationDialogOpen(false)}
      >
        {validationDialogMessage ||
          "The ICCID does not match an eligible SIM for this activation. Please verify your ICCID and try again."}
      </ConfirmDialog>
    </div>
  );
}
