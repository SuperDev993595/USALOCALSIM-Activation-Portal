"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { RedeemFulfillmentPicker } from "@/components/RedeemFulfillmentPicker";
import type { RedeemFulfillmentType } from "@/components/RedeemFulfillmentPicker";
import { RedeemNetworkPicker } from "@/components/RedeemNetworkPicker";
import { RedeemShippingAddressForm } from "@/components/RedeemShippingAddressForm";
import { RedeemShippingMethodPicker } from "@/components/RedeemShippingMethodPicker";
import { RedeemPlanPicker } from "@/components/RedeemPlanPicker";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import type { TmobileAddonOption } from "@/components/RedeemTmobileAddons";
import type { RedeemShippingForm } from "@/lib/redeem-shipping-address";
import {
  REDEEM_BRIGHT_PANEL_CLASS,
  REDEEM_BRIGHT_PANEL_HIGHLIGHT_CLASS,
  REDEEM_PRIMARY_BUTTON_CLASS,
} from "@/lib/redeem-panel";
import type { ShippingMethodId } from "@/lib/shipping-methods";
import type { TmobileAddonSku } from "@/lib/tmobile-addons";

export type SetupHighlight = "network" | "sim" | "details" | "plan" | null;

function SetupSection({
  step,
  title,
  hint,
  highlight,
  dimmed,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  highlight?: boolean;
  dimmed?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border p-4 transition sm:p-5 ${
        highlight
          ? "border-amber-400/50 bg-amber-950/20 ring-1 ring-amber-400/25"
          : dimmed
            ? "border-slate-800/80 bg-black/15 opacity-70"
            : "border-slate-700/55 bg-black/25"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#00104E] text-xs font-bold text-white">
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {hint ? <p className="mt-1 text-sm leading-relaxed text-slate-400">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function RedeemCombinedSetupStep({
  purchaseId,
  accessToken,
  showNetworkSection,
  showFulfillmentSection,
  coverageTier,
  selectedNetworkSlug,
  fulfillmentType,
  ultraEsimOnly,
  iccid,
  iccidDigitCount,
  shippingForm,
  shippingMethodId,
  plans,
  creditCents,
  selectedPlanId,
  showTmobileAddons,
  tmobileAddonOptions,
  selectedAddonSkus,
  plansLoading,
  loading,
  setupReady,
  highlight,
  planOnlyMode,
  panelInputClass,
  onBack,
  onContinue,
  onNetworkSelect,
  onFulfillmentChange,
  onIccidChange,
  onShippingFormChange,
  onShippingMethodChange,
  onSelectPlan,
  onAddonChange,
}: {
  purchaseId: string;
  accessToken: string;
  showNetworkSection: boolean;
  showFulfillmentSection: boolean;
  coverageTier: string | null;
  selectedNetworkSlug: string;
  fulfillmentType: RedeemFulfillmentType;
  ultraEsimOnly: boolean;
  iccid: string;
  iccidDigitCount: number;
  shippingForm: RedeemShippingForm;
  shippingMethodId: ShippingMethodId;
  plans: RedeemPlanRow[];
  creditCents: number;
  selectedPlanId: string;
  showTmobileAddons: boolean;
  tmobileAddonOptions: TmobileAddonOption[];
  selectedAddonSkus: TmobileAddonSku[];
  plansLoading: boolean;
  loading: boolean;
  setupReady: boolean;
  highlight: SetupHighlight;
  planOnlyMode: boolean;
  panelInputClass: string;
  onBack: () => void;
  onContinue: () => void;
  onNetworkSelect: (slug: string) => void;
  onFulfillmentChange: (type: RedeemFulfillmentType) => void;
  onIccidChange: (value: string) => void;
  onShippingFormChange: (form: RedeemShippingForm) => void;
  onShippingMethodChange: (id: ShippingMethodId) => void;
  onSelectPlan: (planId: string) => void;
  onAddonChange: (skus: TmobileAddonSku[]) => void;
}) {
  const t = useTranslations("redeemWizard");

  const networkReady = !showNetworkSection || Boolean(selectedNetworkSlug);
  const showPlanSection = planOnlyMode || networkReady;

  let stepCounter = 0;
  const nextStep = () => ++stepCounter;

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  const planContent =
    plansLoading && plans.length === 0 ? (
      <p className="text-sm text-slate-400" role="status">
        {t("loadingPlans")}
      </p>
    ) : (
      <RedeemPlanPicker
        creditCents={creditCents}
        plans={plans}
        selectedPlanId={selectedPlanId}
        showTmobileAddons={showTmobileAddons}
        tmobileAddonOptions={tmobileAddonOptions}
        selectedAddonSkus={selectedAddonSkus}
        loading={loading}
        onSelectPlan={onSelectPlan}
        onAddonChange={onAddonChange}
      />
    );

  const planPanelClass =
    highlight === "plan"
      ? "rounded-xl border border-amber-400/50 bg-amber-950/20 p-4 ring-1 ring-amber-400/25 sm:p-5"
      : "rounded-xl border border-slate-700/55 bg-black/25 p-4 sm:p-5";

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={backArrowButtonClass}
          aria-label={t("backPhone")}
          disabled={loading}
          onClick={onBack}
        >
          <BackChevronIcon />
        </button>
        <div>
          <h2 id="redeem-setup-heading" className="text-lg font-semibold text-white md:text-xl">
            {planOnlyMode ? t("step4Title") : t("combinedSetupTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {planOnlyMode ? t("step4BodyTail") : t("combinedSetupBody")}
          </p>
        </div>
      </div>

      <div className="mt-6 w-full space-y-5">
        {planOnlyMode ? (
          <div className={`mx-auto max-w-2xl ${planPanelClass}`}>{planContent}</div>
        ) : (
          <div className="space-y-5">
            {showNetworkSection ? (
              <SetupSection
                step={nextStep()}
                title={t("stepNetworkTitle")}
                hint={t("stepNetworkBody")}
                highlight={highlight === "network"}
              >
                <RedeemNetworkPicker
                  purchaseId={purchaseId}
                  accessToken={accessToken}
                  coverageTier={coverageTier}
                  selectedSlug={selectedNetworkSlug}
                  disabled={loading}
                  onSelect={onNetworkSelect}
                />
              </SetupSection>
            ) : null}

            {showFulfillmentSection ? (
              <SetupSection
                step={nextStep()}
                title={t("step3Title")}
                hint={t("step3Body")}
                highlight={highlight === "sim"}
                dimmed={!networkReady}
              >
                {ultraEsimOnly ? (
                  <p className="mb-3 rounded border border-red-500/30 bg-red-950/35 px-3 py-2 text-sm text-red-100">
                    {t("ultraEsimOnlyBanner")}
                  </p>
                ) : null}
                <RedeemFulfillmentPicker
                  value={fulfillmentType}
                  onChange={onFulfillmentChange}
                  disabled={loading || !networkReady}
                  ultraEsimOnly={ultraEsimOnly}
                />
              </SetupSection>
            ) : null}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:gap-8">
              {showPlanSection ? (
                <SetupSection
                  step={nextStep()}
                  title={t("step4Title")}
                  hint={t("step4BodySimple")}
                  highlight={highlight === "plan"}
                  dimmed={plansLoading || !networkReady}
                >
                  {planContent}
                </SetupSection>
              ) : (
                <div className="min-w-0" aria-hidden />
              )}

              {showFulfillmentSection && networkReady ? (
                <aside className="min-w-0 lg:sticky lg:top-4">
                  <SetupSection
                    step={nextStep()}
                    title={t("step3DetailsTitle")}
                    hint={t("step3DetailsBody")}
                    highlight={highlight === "details"}
                  >
                    {fulfillmentType === "ESIM" || ultraEsimOnly ? (
                      <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-relaxed text-slate-300">
                        {t("esimDetailsNote")}
                      </p>
                    ) : null}

                    {fulfillmentType === "EXISTING_SIM" ? (
                      <section
                        className={`${REDEEM_BRIGHT_PANEL_CLASS} ${
                          highlight === "details" ? REDEEM_BRIGHT_PANEL_HIGHLIGHT_CLASS : ""
                        }`}
                        aria-labelledby="redeem-iccid-heading"
                      >
                        <h3 id="redeem-iccid-heading" className="text-base font-semibold text-slate-900">
                          {t("iccidLabel")}
                        </h3>
                        <div className="mt-4 space-y-2.5">
                          <input
                            id="redeem-iccid-input"
                            value={iccid}
                            onChange={(e) => onIccidChange(e.target.value)}
                            disabled={loading}
                            className={panelInputClass}
                            placeholder={t("iccidPlaceholder")}
                            aria-describedby="redeem-iccid-hint redeem-iccid-count"
                          />
                          <p id="redeem-iccid-hint" className="text-xs text-slate-500">
                            {t("iccidHint")}
                          </p>
                          <p id="redeem-iccid-count" className="text-xs text-slate-400">
                            {t("iccidCount", { count: iccidDigitCount })}
                          </p>
                        </div>
                      </section>
                    ) : null}

                    {fulfillmentType === "NEW_SIM_SHIPPING" ? (
                      <div className="space-y-6">
                        <RedeemShippingAddressForm
                          value={shippingForm}
                          onChange={onShippingFormChange}
                          disabled={loading}
                          fieldClass={panelInputClass}
                        />
                        <div className="space-y-3 border-t border-white/10 pt-5">
                          <h4 className="text-sm font-semibold text-white">{t("shippingMethodHeading")}</h4>
                          <RedeemShippingMethodPicker
                            shippingMethodId={shippingMethodId}
                            disabled={loading}
                            onChange={onShippingMethodChange}
                          />
                        </div>
                      </div>
                    ) : null}
                  </SetupSection>
                </aside>
              ) : null}
            </div>
          </div>
        )}

        <button
          type="button"
          className={`${REDEEM_PRIMARY_BUTTON_CLASS} mx-auto block w-full max-w-md font-semibold lg:max-w-sm`}
          disabled={loading || !setupReady || !selectedPlanId}
          onClick={onContinue}
        >
          {loading ? t("processingCheckout") : t("continueToPayment")}
        </button>
      </div>
    </>
  );
}
