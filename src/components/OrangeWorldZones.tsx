"use client";

import { useTranslations } from "next-intl";
import { ORANGE_WORLD_ZONES } from "@/lib/orange-world-zones";
import {
  ORANGE_WORLD_ZONE_ALLOWANCES_BY_TIER,
  orangeWorldBundleTierFromDataAllowance,
} from "@/lib/orange-world-zone-allowances";
import { REDEEM_INSET_PANEL_CLASS } from "@/lib/redeem-panel";

export function OrangeWorldZones({ dataAllowance }: { dataAllowance: string }) {
  const t = useTranslations("orangeLanding");
  const tier = orangeWorldBundleTierFromDataAllowance(dataAllowance);
  if (!tier) return null;

  const allowances = ORANGE_WORLD_ZONE_ALLOWANCES_BY_TIER[tier];
  const allowanceByZone = new Map(allowances.map((row) => [row.zoneId, row]));

  return (
    <details className="orange-world-zones group mt-4 rounded-xl border border-white/12 bg-black/20 open:border-white/18 open:bg-black/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.04] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span>{t("worldZonesToggle")}</span>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs text-slate-300 transition group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div
        className={`orange-world-zones-panel ${REDEEM_INSET_PANEL_CLASS} mx-4 mb-4 mt-1 space-y-4 border-white/10 p-4 sm:p-5`}
      >
        <p className="text-xs leading-relaxed text-slate-400 sm:text-[13px]">{t("worldZonesIntro")}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-xs text-slate-300 sm:text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-semibold">{t("worldZonesColZone")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("worldZonesColData")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("worldZonesColMinutes")}</th>
                <th className="pb-2 font-semibold">{t("worldZonesColSms")}</th>
              </tr>
            </thead>
            <tbody>
              {allowances.map((row) => {
                const zone = ORANGE_WORLD_ZONES.find((z) => z.id === row.zoneId);
                return (
                  <tr key={row.zoneId} className="border-b border-white/5">
                    <td className="py-2 pr-3 font-medium text-white">{zone?.label ?? row.zoneId}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.dataLabel}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {row.intlMinutes != null ? row.intlMinutes : "—"}
                    </td>
                    <td className="py-2 tabular-nums">{row.intlSms != null ? row.intlSms : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ORANGE_WORLD_ZONES.map((zone) => {
          const allowance = allowanceByZone.get(zone.id);
          return (
            <details key={zone.id} className="rounded-lg border border-white/8 bg-black/20">
              <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-slate-200 sm:text-[13px]">
                {zone.label}
                {allowance ? (
                  <span className="ml-2 font-normal text-slate-500">
                    · {allowance.dataLabel}
                    {allowance.intlMinutes != null ? ` · ${allowance.intlMinutes} min` : ""}
                  </span>
                ) : null}
              </summary>
              <p className="px-3 pb-3 text-xs leading-relaxed text-slate-400">{zone.countries.join(", ")}</p>
            </details>
          );
        })}
      </div>
    </details>
  );
}
