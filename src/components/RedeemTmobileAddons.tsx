"use client";

import { useTranslations } from "next-intl";
import {
  normalizeTmobileAddonSkus,
  type TmobileAddonSku,
} from "@/lib/tmobile-addons";

export type TmobileAddonOption = {
  sku: string;
  label: string;
  description: string;
  priceCents: number;
};

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
    <div className="space-y-3 rounded border border-[#E20074]/35 bg-[#E20074]/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-pink-200">{t("tmobileAddonsHeading")}</p>
      <p className="text-xs text-slate-300">{t("tmobileAddonsHint")}</p>
      <ul className="space-y-2.5">
        {options.map((opt) => {
          const sku = opt.sku as TmobileAddonSku;
          const checked = selected.includes(sku);
          return (
            <li key={opt.sku}>
              <label className="flex cursor-pointer gap-3 rounded border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => toggle(sku, e.target.checked)}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-white">
                    {opt.label}{" "}
                    <span className="text-pink-200">+${(opt.priceCents / 100).toFixed(2)}</span>
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">{opt.description}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
