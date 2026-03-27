"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function AdminIccidValidationSettings() {
  const [strictDatabaseCheck, setStrictDatabaseCheck] = useState(true);
  const [whitelistCount, setWhitelistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [replaceAll, setReplaceAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
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
      setMessage("Failed to load ICCID validation settings.");
      setMessageTone("error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveToggle(next: boolean) {
    setSavingToggle(true);
    setMessage(null);
    setMessageTone(null);
    try {
      const res = await fetch("/api/admin/config/iccid-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strictDatabaseCheck: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error ?? "__genericSaveFailed__");
        setMessageTone("error");
        return;
      }
      setStrictDatabaseCheck(!!data.strictDatabaseCheck);
      setWhitelistCount(Number(data.whitelistCount) || 0);
      setMessage(next ? "Master list validation is ON (only listed ICCIDs are accepted)." : "Pattern-only mode is ON (19–20 digit, 89…, Luhn). Master list is ignored.");
      setMessageTone("success");
    } catch {
      setMessage("__genericSaveFailed__");
      setMessageTone("error");
    }
    setSavingToggle(false);
  }

  async function runImport(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setMessage("Paste CSV/Excel export text or choose a file first.");
      setMessageTone("error");
      return;
    }
    setImporting(true);
    setMessage(null);
    setMessageTone(null);
    try {
      const res = await fetch("/api/admin/iccid-whitelist/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, replace: replaceAll }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error ?? "Import failed.");
        setMessageTone("error");
        return;
      }
      setWhitelistCount(Number(data.whitelistCount) || 0);
      setMessage(
        `Imported ${data.inserted} new ICCIDs (${data.parsed} parsed). Total in list: ${data.whitelistCount}.`
      );
      setMessageTone("success");
      setBulkText("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setMessage("Import failed.");
      setMessageTone("error");
    }
    setImporting(false);
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const t = typeof reader.result === "string" ? reader.result : "";
      setBulkText(t);
    };
    reader.readAsText(file);
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading ICCID validation…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-none border border-slate-200 bg-slate-50/80 p-4 md:p-5">
        <h3 className="text-sm font-semibold text-slate-900">Validation mode</h3>
        <p className="mt-2 text-xs text-slate-600">
          When <strong>master list required</strong> is on, only ICCIDs you import below are accepted. Turn it off to allow any SIM number that matches the fallback rule (19–20 digits, starts with 89, valid Luhn check digit).
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-3">
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
              Require ICCID master list{" "}
              <span className="font-normal text-slate-500">({strictDatabaseCheck ? "on" : "off"})</span>
            </span>
          </label>
          <p className="text-xs text-slate-500">
            {whitelistCount.toLocaleString()} ICCID{whitelistCount === 1 ? "" : "s"} in database
          </p>
        </div>
      </div>

      <div className="rounded-none border border-slate-200 bg-slate-50/80 p-4 md:p-5">
        <h3 className="text-sm font-semibold text-slate-900">Import master list</h3>
        <p className="mt-2 text-xs text-slate-600">
          Paste exported CSV/Excel text or upload a <code className="rounded bg-slate-100 px-1">.csv</code> file. Any column with 15–22 consecutive digits is treated as an ICCID. Excel files should be saved as CSV first.
        </p>
        <label className="ui-label !mt-4">File</label>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={onFilePick}
          className="mt-1 block w-full max-w-md text-sm text-slate-600"
        />
        <label htmlFor="iccid-bulk" className="ui-label !mt-4">
          Paste list
        </label>
        <textarea
          id="iccid-bulk"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={8}
          placeholder={"ICCID\n89014103211118510720\n…"}
          className="ui-input mt-1 min-h-[140px] w-full max-w-2xl resize-y font-mono text-sm"
        />
        <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={replaceAll} onChange={(e) => setReplaceAll(e.target.checked)} />
          Replace entire list (clear all existing ICCIDs before import)
        </label>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void runImport(bulkText)}
            disabled={importing}
            className="btn-primary h-11 min-w-[120px] rounded-none"
          >
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
      </div>

      {message ? (
        <p
          className={
            messageTone === "success"
              ? "text-sm font-medium text-success-hover"
              : "text-sm font-medium text-red-600"
          }
          role="status"
        >
          {message === "__genericSaveFailed__" ? "Save failed." : message}
        </p>
      ) : null}
    </div>
  );
}
