"use client";

import { useTranslations } from "next-intl";
import {
  normalizeTmobileAddonSkus,
  type TmobileAddonSku,
} from "@/lib/tmobile-addons";
import { REDEEM_CHOICE_CARD_IDLE } from "@/lib/redeem-panel";

export type TmobileAddonOption = {
  sku: string;
  label: string;
  description: string;
  priceCents: number;
};

function AddonCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5 8.25L6.5 11.25L12.5 4.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RedeemTmobileAddons({
  options,
  selected,
  disabled,
  onChange,
}: {
  options: TmobileAddonOption[];
  selected: string[];
  disabled: boolean;
  onChange: (skus: TmobileAddonSku[]) => void;
}) {
  const t = useTranslations("redeemWizard");

  function toggle(sku: TmobileAddonSku, checked: boolean) {
    let next = [...selected];
    if (sku === "ADD-TM-COMBO") {
      next = checked ? ["ADD-TM-COMBO"] : [];
    } else if (checked) {
      next = normalizeTmobileAddonSkus([...next.filter((s) => s !== "ADD-TM-COMBO"), sku]);
    } else {
      next = next.filter((s) => s !== sku);
    }
    onChange(normalizeTmobileAddonSkus(next));
  }

  return (
    <div className="space-y-3 rounded-lg border border-[#E20074]/25 bg-[#E20074]/[0.05] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-pink-200/95">
        {t("tmobileAddonsHeading")}
      </p>
      <p className="text-xs text-slate-400">{t("tmobileAddonsHint")}</p>
      <ul className="space-y-2" role="group" aria-label={t("tmobileAddonsHeading")}>
        {options.map((opt) => {
          const sku = opt.sku as TmobileAddonSku;
          const checked = selected.includes(sku);
          return (
            <li key={opt.sku}>
              <label
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors duration-150 ${
                  disabled ? "cursor-not-allowed opacity-60" : "hover:border-[#E20074]/45"
                } ${
                  checked
                    ? "border-[#E20074]/55 bg-[#E20074]/15 shadow-[inset_0_0_0_1px_rgba(226,0,116,0.12)]"
                    : REDEEM_CHOICE_CARD_IDLE
                }`}
              >
                <span className="relative mt-0.5 h-5 w-5 shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => toggle(sku, e.target.checked)}
                  />
                  <span
                    className="pointer-events-none absolute inset-0 rounded border border-white/25 bg-slate-950/80 transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-[#E20074]/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-950 peer-checked:border-[#E20074] peer-checked:bg-[#E20074] peer-disabled:opacity-50"
                    aria-hidden
                  />
                  <AddonCheckIcon className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
                </span>
                <span className="min-w-0 flex-1 text-slate-200">
                  <span className="font-medium text-white">
                    {opt.label}{" "}
                    <span className={checked ? "text-pink-200" : "text-pink-300/80"}>
                      +${(opt.priceCents / 100).toFixed(2)}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-400">{opt.description}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
