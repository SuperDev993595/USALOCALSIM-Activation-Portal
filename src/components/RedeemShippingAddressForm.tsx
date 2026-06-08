"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RedeemShippingPhoneInput } from "@/components/RedeemShippingPhoneInput";
import type { RedeemShippingForm } from "@/lib/redeem-shipping-address";
import {
  listShippingCountries,
  normalizeShippingCountryCode,
} from "@/lib/shipping-country-catalog";
import { getShippingSubdivisions } from "@/lib/shipping-subdivisions";
import { REDEEM_BRIGHT_PANEL_CLASS } from "@/lib/redeem-panel";

const DEFAULT_FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]/40 [color-scheme:light]";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function RedeemShippingAddressForm({
  value,
  onChange,
  disabled = false,
  fieldClass = DEFAULT_FIELD_CLASS,
}: {
  value: RedeemShippingForm;
  onChange: (next: RedeemShippingForm) => void;
  disabled?: boolean;
  fieldClass?: string;
}) {
  const t = useTranslations("redeemWizard");
  const locale = useLocale();
  const countries = useMemo(() => listShippingCountries(locale), [locale]);
  const country = normalizeShippingCountryCode(value.country, locale);
  const subdivisions = useMemo(() => getShippingSubdivisions(country), [country]);

  function patch(partial: Partial<RedeemShippingForm>) {
    const next = { ...value, ...partial };

    if (partial.country !== undefined) {
      next.country = normalizeShippingCountryCode(partial.country, locale);
      next.state = "";
    }

    if (partial.phoneCountry !== undefined) {
      next.phoneCountry = normalizeShippingCountryCode(partial.phoneCountry, locale);
    }

    onChange(next);
  }

  return (
    <section
      className={REDEEM_BRIGHT_PANEL_CLASS}
      aria-labelledby="redeem-shipping-heading"
    >
      <h3 id="redeem-shipping-heading" className="text-base font-semibold text-slate-900">
        {t("shippingHeading")}
      </h3>

      <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="redeem-ship-first" label={t("shippingFirstName")}>
          <input
            id="redeem-ship-first"
            type="text"
            autoComplete="given-name"
            value={value.firstName}
            disabled={disabled}
            className={fieldClass}
            onChange={(e) => patch({ firstName: e.target.value })}
          />
        </Field>
        <Field id="redeem-ship-last" label={t("shippingLastName")}>
          <input
            id="redeem-ship-last"
            type="text"
            autoComplete="family-name"
            value={value.lastName}
            disabled={disabled}
            className={fieldClass}
            onChange={(e) => patch({ lastName: e.target.value })}
          />
        </Field>
      </div>

      <Field id="redeem-ship-company" label={t("shippingCompany")}>
        <input
          id="redeem-ship-company"
          type="text"
          autoComplete="organization"
          value={value.company}
          disabled={disabled}
          className={fieldClass}
          onChange={(e) => patch({ company: e.target.value })}
        />
      </Field>

      <Field id="redeem-ship-street" label={t("shippingStreet")}>
        <input
          id="redeem-ship-street"
          type="text"
          autoComplete="street-address"
          value={value.streetAddress}
          disabled={disabled}
          className={fieldClass}
          onChange={(e) => patch({ streetAddress: e.target.value })}
        />
      </Field>

      <Field id="redeem-ship-line2" label={t("shippingLine2")}>
        <input
          id="redeem-ship-line2"
          type="text"
          autoComplete="address-line2"
          value={value.addressLine2}
          disabled={disabled}
          className={fieldClass}
          onChange={(e) => patch({ addressLine2: e.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="redeem-ship-country" label={t("shippingCountry")}>
          <select
            id="redeem-ship-country"
            autoComplete="country"
            value={country}
            disabled={disabled}
            className={fieldClass}
            onChange={(e) => patch({ country: e.target.value })}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="redeem-ship-city" label={t("shippingCity")}>
          <input
            id="redeem-ship-city"
            type="text"
            autoComplete="address-level2"
            value={value.city}
            disabled={disabled}
            className={fieldClass}
            onChange={(e) => patch({ city: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="redeem-ship-postcode" label={t("shippingPostcode")}>
          <input
            id="redeem-ship-postcode"
            type="text"
            autoComplete="postal-code"
            value={value.postcode}
            disabled={disabled}
            className={fieldClass}
            onChange={(e) => patch({ postcode: e.target.value })}
          />
        </Field>
        <Field id="redeem-ship-state" label={t("shippingState")}>
          {subdivisions ? (
            <select
              id="redeem-ship-state"
              autoComplete="address-level1"
              value={value.state}
              disabled={disabled}
              className={fieldClass}
              onChange={(e) => patch({ state: e.target.value })}
            >
              <option value="">{t("shippingStatePlaceholder")}</option>
              {subdivisions.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="redeem-ship-state"
              type="text"
              autoComplete="address-level1"
              value={value.state}
              disabled={disabled}
              className={fieldClass}
              placeholder={t("shippingStatePlaceholder")}
              onChange={(e) => patch({ state: e.target.value })}
            />
          )}
        </Field>
      </div>

      <RedeemShippingPhoneInput
        label={t("shippingPhone")}
        country={value.phoneCountry}
        value={value.phone}
        disabled={disabled}
        lightPanel
        onCountryChange={(phoneCountry) => patch({ phoneCountry })}
        onChange={(phone) => patch({ phone })}
      />
      </div>
    </section>
  );
}
