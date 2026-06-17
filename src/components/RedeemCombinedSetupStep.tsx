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
import { RedeemOrangeUltraPlanPicker } from "@/components/RedeemOrangeUltraPlanPicker";
import { RedeemBasicPlanPicker } from "@/components/RedeemBasicPlanPicker";
import { RedeemThreeUkPlanPicker } from "@/components/RedeemThreeUkPlanPicker";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import type { TmobileAddonSku } from "@/lib/tmobile-addons";
import type { TmobileAddonOption } from "@/components/RedeemTmobileAddons";
import type { RedeemShippingForm } from "@/lib/redeem-shipping-address";
import {
  REDEEM_BRIGHT_PANEL_CLASS,
  REDEEM_BRIGHT_PANEL_HIGHLIGHT_CLASS,
  REDEEM_INFO_STRIP_CLASS,
  REDEEM_PRIMARY_BUTTON_CLASS,
  REDEEM_SECTION_CLASS,
  REDEEM_SECTION_DIMMED_CLASS,
  REDEEM_SECTION_HEADER_CLASS,
  REDEEM_SECTION_HIGHLIGHT_CLASS,
} from "@/lib/redeem-panel";
import type { ShippingMethodId } from "@/lib/shipping-methods";
import { RedeemTierPicker } from "@/components/RedeemTierPicker";
import { RedeemTierNetworkDisplay } from "@/components/RedeemTierNetworkDisplay";
import type { CoverageTier } from "@/lib/coverage-tier";
import { COVERAGE_TIER, coverageTierNetworkBodyKey, isCoverageTier } from "@/lib/coverage-tier";
import { redeemPlansUseOrangeUltraPicker } from "@/lib/orange-redeem-plans";
import { redeemPlansUseBasicPicker } from "@/lib/basic-redeem-plans";
import { redeemPlansUseThreeUkPicker } from "@/lib/three-uk-redeem-plans";

export type SetupHighlight = "tier" | "network" | "sim" | "details" | "plan" | null;

function SetupSection({
  step,
  title,
  hint,
  highlight,
  dimmed,
  bodyCentered = false,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  highlight?: boolean;
  dimmed?: boolean;
  /** Center step body in the remaining section space (network column beside tier picker). */
  bodyCentered?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`${REDEEM_SECTION_CLASS}${bodyCentered ? " flex h-full flex-col" : ""}${
        highlight ? ` ${REDEEM_SECTION_HIGHLIGHT_CLASS}` : ""
      }${dimmed ? ` ${REDEEM_SECTION_DIMMED_CLASS}` : ""}`}
    >
      <div className={`${REDEEM_SECTION_HEADER_CLASS}${highlight ? " border-amber-500/30" : ""}`}>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-white ${
            highlight
              ? "border-amber-500/45 bg-amber-500/20"
              : "border-slate-500/55 bg-[#00104E]"
          }`}
        >
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {hint ? <p className="mt-1 text-sm leading-relaxed text-slate-400">{hint}</p> : null}
        </div>
      </div>
      {bodyCentered ? (
        <div className="flex min-h-[10rem] w-full flex-1 flex-col items-center justify-center px-1 py-2 sm:min-h-[12rem]">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function RedeemCombinedSetupStep({
  purchaseId,
  accessToken,
  showNetworkSection,
  showTierSection,
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
  plansRefreshing,
  loading,
  quoteBusy,
  setupReady,
  highlight,
  planOnlyMode,
  panelInputClass,
  onBack,
  onContinue,
  onNetworkSelect,
  onTierSelect,
  tierPending,
  tierError,
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
  showTierSection: boolean;
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
  plansRefreshing?: boolean;
  loading: boolean;
  quoteBusy?: boolean;
  setupReady: boolean;
  highlight: SetupHighlight;
  planOnlyMode: boolean;
  panelInputClass: string;
  onBack: () => void;
  onContinue: () => void;
  onNetworkSelect: (slug: string) => void;
  onTierSelect: (tier: CoverageTier) => void;
  tierPending?: CoverageTier | null;
  tierError?: string | null;
  onFulfillmentChange: (type: RedeemFulfillmentType) => void;
  onIccidChange: (value: string) => void;
  onShippingFormChange: (form: RedeemShippingForm) => void;
  onShippingMethodChange: (id: ShippingMethodId) => void;
  onSelectPlan: (planId: string) => void;
  onAddonChange: (skus: TmobileAddonSku[]) => void;
}) {
  const t = useTranslations("redeemWizard");

  const tierReady = !showTierSection || isCoverageTier(coverageTier ?? "");
  const isBasicTier = isCoverageTier(coverageTier ?? "") && coverageTier === COVERAGE_TIER.BASIC;
  /** Tier flow: BASIC needs an explicit network pick; legacy flow uses showNetworkSection. */
  const networkRequiredForPlans = showTierSection ? isBasicTier : showNetworkSection;
  const networkColumnInteractive = showTierSection && isBasicTier;
  const networkColumnDimmed = !tierReady;
  const selectionReady = tierReady && (!networkRequiredForPlans || Boolean(selectedNetworkSlug));
  const showPlanSection = planOnlyMode || !showTierSection || tierReady;

  let stepCounter = 0;
  const nextStep = () => ++stepCounter;

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-500/55 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/45 disabled:pointer-events-none disabled:opacity-40";

  const isUltraTier = isCoverageTier(coverageTier ?? "") && coverageTier === COVERAGE_TIER.ULTRA;
  const isProTier = isCoverageTier(coverageTier ?? "") && coverageTier === COVERAGE_TIER.PRO;
  const networkSlugForPlans =
    selectedNetworkSlug || (isUltraTier ? "orange" : isProTier ? "three_uk" : "");
  const useOrangeUltraPicker = redeemPlansUseOrangeUltraPicker(plans, ultraEsimOnly, networkSlugForPlans);
  const useThreeUkPicker = !useOrangeUltraPicker && redeemPlansUseThreeUkPicker(plans, networkSlugForPlans);
  const useBasicPicker =
    !useOrangeUltraPicker && !useThreeUkPicker && redeemPlansUseBasicPicker(plans, networkSlugForPlans);

  const planContent =
    plansLoading && plans.length === 0 ? (
      <p className="text-sm text-slate-400" role="status">
        {t("loadingPlans")}
      </p>
    ) : useOrangeUltraPicker ? (
      <RedeemOrangeUltraPlanPicker
        creditCents={creditCents}
        plans={plans}
        selectedPlanId={selectedPlanId}
        loading={loading}
        refreshing={plansRefreshing}
        onSelectPlan={onSelectPlan}
      />
    ) : useThreeUkPicker ? (
      <RedeemThreeUkPlanPicker
        creditCents={creditCents}
        plans={plans}
        selectedPlanId={selectedPlanId}
        loading={loading}
        refreshing={plansRefreshing}
        onSelectPlan={onSelectPlan}
      />
    ) : useBasicPicker ? (
      <RedeemBasicPlanPicker
        creditCents={creditCents}
        plans={plans}
        selectedPlanId={selectedPlanId}
        networkSlug={networkSlugForPlans}
        strictCatalog={isBasicTier}
        showTmobileAddons={showTmobileAddons}
        tmobileAddonOptions={tmobileAddonOptions}
        selectedAddonSkus={selectedAddonSkus}
        loading={loading}
        refreshing={plansRefreshing}
        onSelectPlan={onSelectPlan}
        onAddonChange={onAddonChange}
      />
    ) : (
      <RedeemPlanPicker
        creditCents={creditCents}
        plans={plans}
        selectedPlanId={selectedPlanId}
        showTmobileAddons={showTmobileAddons}
        tmobileAddonOptions={tmobileAddonOptions}
        selectedAddonSkus={selectedAddonSkus}
        loading={loading}
        refreshing={plansRefreshing}
        onSelectPlan={onSelectPlan}
        onAddonChange={onAddonChange}
      />
    );

  const planPanelClass = highlight === "plan" ? REDEEM_SECTION_HIGHLIGHT_CLASS : "";

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
            {planOnlyMode
              ? t("step4BodyTail")
              : t(showTierSection ? "combinedSetupBodyTier" : "combinedSetupBody")}
          </p>
        </div>
      </div>

      <div className="mt-6 w-full space-y-6">
        {planOnlyMode ? (
          <div className={`mx-auto max-w-2xl ${REDEEM_SECTION_CLASS} ${planPanelClass}`.trim()}>{planContent}</div>
        ) : (
          <div className="space-y-6">
            {showTierSection ? (
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch xl:gap-8">
                <SetupSection
                  step={nextStep()}
                  title={t("stepTierTitle")}
                  hint={t("stepTierBody")}
                  highlight={highlight === "tier"}
                >
                  <RedeemTierPicker
                    selectedTier={coverageTier}
                    pendingTier={tierPending ?? null}
                    error={tierError ?? null}
                    disabled={loading}
                    onPickTier={onTierSelect}
                  />
                </SetupSection>
                <SetupSection
                  step={nextStep()}
                  title={networkColumnInteractive ? t("stepNetworkTitle") : t("tierNetworkDisplayTitle")}
                  hint={
                    !tierReady
                      ? t("stepNetworkBodySelectTierFirst")
                      : networkColumnInteractive
                        ? tierPending
                          ? t("savingTier")
                          : t("stepNetworkBody_basic_pick")
                        : isCoverageTier(coverageTier ?? "")
                          ? t(coverageTierNetworkBodyKey(coverageTier))
                          : t("tierNetworkDisplayEmpty")
                  }
                  highlight={highlight === "network"}
                  dimmed={networkColumnDimmed}
                  bodyCentered
                >
                  {!tierReady ? (
                    <p className="max-w-sm text-center text-sm leading-relaxed text-slate-500">
                      {t("stepNetworkBodySelectTierFirst")}
                    </p>
                  ) : networkColumnInteractive ? (
                    <RedeemNetworkPicker
                      key={coverageTier ?? "basic"}
                      purchaseId={purchaseId}
                      accessToken={accessToken}
                      coverageTier={coverageTier}
                      selectedSlug={selectedNetworkSlug}
                      disabled={loading}
                      quoteBusy={quoteBusy}
                      onSelect={onNetworkSelect}
                    />
                  ) : (
                    <RedeemTierNetworkDisplay coverageTier={coverageTier} />
                  )}
                </SetupSection>
              </div>
            ) : null}

            {showNetworkSection && !showTierSection ? (
              <SetupSection
                step={nextStep()}
                title={t("stepNetworkTitle")}
                hint={tierReady ? t("stepNetworkBody_basic_pick") : t("stepNetworkBodySelectTierFirst")}
                highlight={highlight === "network"}
                dimmed={!tierReady}
                bodyCentered
              >
                {tierReady ? (
                  <RedeemNetworkPicker
                    purchaseId={purchaseId}
                    accessToken={accessToken}
                    coverageTier={coverageTier}
                    selectedSlug={selectedNetworkSlug}
                    disabled={loading}
                    quoteBusy={quoteBusy}
                    onSelect={onNetworkSelect}
                  />
                ) : (
                  <p className="max-w-sm text-center text-sm leading-relaxed text-slate-500">
                    {t("stepNetworkBodySelectTierFirst")}
                  </p>
                )}
              </SetupSection>
            ) : null}

            {showPlanSection ? (
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8 xl:gap-10">
                <SetupSection
                  step={nextStep()}
                  title={t("step4Title")}
                  hint={selectionReady ? t("step4BodySimple") : isBasicTier && tierReady && !selectedNetworkSlug ? t("stepPlansSelectNetworkFirst") : t("stepPlansSelectTierFirst")}
                  highlight={highlight === "plan"}
                  dimmed={!selectionReady}
                >
                  <div className={plansRefreshing ? "opacity-80 transition-opacity duration-150" : undefined}>
                    {selectionReady ? (
                      planContent
                    ) : isBasicTier && tierReady && !selectedNetworkSlug ? (
                      <p className="text-sm leading-relaxed text-slate-500">{t("stepPlansSelectNetworkFirst")}</p>
                    ) : (
                      <p className="text-sm leading-relaxed text-slate-500">{t("stepPlansSelectTierFirst")}</p>
                    )}
                  </div>
                </SetupSection>

                {showFulfillmentSection ? (
                  <div className="min-w-0 space-y-6 lg:sticky lg:top-4">
                    <SetupSection
                      step={nextStep()}
                      title={t("step3Title")}
                      hint={t("step3Body")}
                      highlight={highlight === "sim"}
                      dimmed={!selectionReady}
                    >
                      {ultraEsimOnly ? (
                        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-sm text-red-100">
                          {t("ultraEsimOnlyBanner")}
                        </p>
                      ) : null}
                      <RedeemFulfillmentPicker
                        value={fulfillmentType}
                        onChange={onFulfillmentChange}
                        disabled={loading || !selectionReady}
                        ultraEsimOnly={ultraEsimOnly}
                      />
                    </SetupSection>

                    {selectionReady ? (
                      <SetupSection
                        step={nextStep()}
                        title={t("step3DetailsTitle")}
                        hint={t("step3DetailsBody")}
                        highlight={highlight === "details"}
                      >
                        {fulfillmentType === "ESIM" || ultraEsimOnly ? (
                          <p className={REDEEM_INFO_STRIP_CLASS}>{t("esimDetailsNote")}</p>
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
                            <div className="space-y-3 border-t border-slate-500/50 pt-5">
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
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
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
