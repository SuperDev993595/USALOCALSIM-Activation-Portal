"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useCallback, useEffect, useRef, useState } from "react";

function ModePill({ strict, loading }: { strict: boolean; loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
        Loading…
      </span>
    );
  }
  return strict ? (
    <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200/90 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      Master list required
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
      <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden />
      Pattern fallback (Luhn)
    </span>
  );
}

function CountPill({ count, loading }: { count: number; loading: boolean }) {
  if (loading) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
      <strong className="font-semibold text-slate-900">{count.toLocaleString()}</strong>
      ICCID{count === 1 ? "" : "s"} in database
    </span>
  );
}

export function AdminIccidValidationSettings() {
  const [strictDatabaseCheck, setStrictDatabaseCheck] = useState(true);
  const [whitelistCount, setWhitelistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [replaceAll, setReplaceAll] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config/iccid-validation");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");
      setStrictDatabaseCheck(!!data.strictDatabaseCheck);
      setWhitelistCount(Number(data.whitelistCount) || 0);
    } catch {
      setBanner({ variant: "error", message: "Failed to load ICCID validation settings." });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener(ADMIN_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onRefresh);
  }, [load]);

  async function saveToggle(next: boolean) {
    setSavingToggle(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/config/iccid-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strictDatabaseCheck: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          variant: "error",
          message: typeof data?.error === "string" ? data.error : "Could not update validation mode.",
        });
        return;
      }
      setStrictDatabaseCheck(!!data.strictDatabaseCheck);
      setWhitelistCount(Number(data.whitelistCount) || 0);
      setBanner({
        variant: "success",
        message: next
          ? "Master list validation is on — only imported ICCIDs are accepted."
          : "Pattern-only mode is on — master list is ignored.",
      });
    } catch {
      setBanner({ variant: "error", message: "Could not update validation mode." });
    }
    setSavingToggle(false);
  }

  async function runImport(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setBanner({ variant: "error", message: "Paste CSV/Excel export text or choose a file first." });
      return;
    }
    setImporting(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/iccid-whitelist/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, replace: replaceAll }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          variant: "error",
          message: typeof data?.error === "string" ? data.error : "Import failed.",
        });
        return;
      }
      setWhitelistCount(Number(data.whitelistCount) || 0);
      setBanner({
        variant: "success",
        message: `Imported ${data.inserted} new ICCIDs (${data.parsed} parsed). Total in list: ${data.whitelistCount}.`,
      });
      setBulkText("");
      setSelectedFileName(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setBanner({ variant: "error", message: "Import failed." });
    }
    setImporting(false);
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFileName(null);
      return;
    }
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const t = typeof reader.result === "string" ? reader.result : "";
      setBulkText(t);
    };
    reader.readAsText(file);
  }

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Catalog" }, { label: "ICCID validation" }]}
        title="ICCID validation"
        description="Master list import or pattern fallback (89…, Luhn) for redeem ICCIDs."
        meta={
          <>
            <ModePill strict={strictDatabaseCheck} loading={loading} />
            <CountPill count={whitelistCount} loading={loading} />
          </>
        }
      />

      {banner ? (
        <AdminFeedbackBanner
          variant={banner.variant}
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      ) : null}

      <section className="admin-panel">
        <div className="p-5 md:p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading validation settings…</p>
          ) : (
            <div className="admin-settings-block">
              <div className="admin-settings-block-head">
                <h2 className="admin-settings-block-title">Validation mode</h2>
                <p className="admin-settings-block-desc">
                  When master list is required, only ICCIDs you import below are accepted. Turn off to allow any number
                  that passes the fallback pattern.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3">
                <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={strictDatabaseCheck}
                    className="peer sr-only"
                    checked={strictDatabaseCheck}
                    disabled={savingToggle}
                    onChange={(e) => void saveToggle(e.target.checked)}
                  />
                  <span
                    className={
                      "absolute inset-0 rounded-full border border-slate-300 bg-slate-200 transition peer-checked:border-accent/40 peer-checked:bg-accent/25 " +
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 peer-disabled:opacity-50"
                    }
                    aria-hidden
                  />
                  <span
                    className={
                      "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition peer-checked:left-[calc(100%-1.75rem)] " +
                      "peer-checked:bg-accent"
                    }
                    aria-hidden
                  />
                </span>
                <span className="text-sm font-medium text-slate-800">
                  Require ICCID master list
                  <span className="ml-1 font-normal text-slate-500">
                    ({strictDatabaseCheck ? "on" : "off"})
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="space-y-5 p-5 md:p-6">
          <div className="admin-settings-block">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Import master list</h2>
              <p className="admin-settings-block-desc">
                Paste exported CSV/Excel text or upload a{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">.csv</code> file. Any column with
                15–22 consecutive digits is treated as an ICCID. Save Excel as CSV first.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="ui-label !mt-0">Upload file</span>
                <div className="admin-file-picker mt-2">
                  <input
                    id="iccid-file"
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    onChange={onFilePick}
                    className="sr-only"
                  />
                  <label htmlFor="iccid-file" className="admin-file-picker-btn">
                    Choose file
                  </label>
                  <span className="admin-file-picker-name" title={selectedFileName ?? undefined}>
                    {selectedFileName ?? "No file chosen"}
                  </span>
                  {selectedFileName ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
                      onClick={() => {
                        setSelectedFileName(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="iccid-bulk" className="ui-label !mt-0">
                  Or paste list
                </label>
                <textarea
                  id="iccid-bulk"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={10}
                  placeholder={"ICCID\n89014103211118510720\n…"}
                  className="ui-input mt-1 min-h-[160px] w-full resize-y rounded-none font-mono text-sm"
                />
              </div>

              <label className="admin-option-card">
                <input
                  type="checkbox"
                  checked={replaceAll}
                  onChange={(e) => setReplaceAll(e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Replace entire list</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                    Clears all existing ICCIDs in the database before importing the pasted or uploaded list. Use only
                    when you are uploading a full replacement export.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {strictDatabaseCheck
                ? "Imported ICCIDs are checked on redeem when master list is required."
                : "Imports are stored but ignored until you turn master list enforcement on."}
            </p>
            <button
              type="button"
              onClick={() => void runImport(bulkText)}
              disabled={importing || loading}
              className="btn-primary h-10 min-w-[120px] shrink-0 rounded-none sm:ml-auto"
            >
              {importing ? "Importing…" : "Import list"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
