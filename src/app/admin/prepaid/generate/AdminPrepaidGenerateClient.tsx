"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { PrepaidGeneratedCard } from "@/lib/prepaid-barcode-generate";
import { prepaidRowsToCsv } from "@/lib/prepaid-barcode-generate";

type Gs1Field = { ai: string; label: string; value: string };

export function AdminPrepaidGenerateClient() {
  const [mode, setMode] = useState<"test" | "gs1">("test");
  const [count, setCount] = useState(3);
  const [serialPrefix, setSerialPrefix] = useState("USALOCAL");
  const [serialStart, setSerialStart] = useState(1);
  const [retailMarket, setRetailMarket] = useState("us");
  const [voucherProductType, setVoucherProductType] = useState<"global" | "three_uk">("global");
  const [faceValueCents, setFaceValueCents] = useState(5000);
  const [gtin, setGtin] = useState("");
  const [lot, setLot] = useState("LOT01");
  const [expiryYymmdd, setExpiryYymmdd] = useState("");
  const [qrUseFullUrl, setQrUseFullUrl] = useState(true);
  const [qrTarget, setQrTarget] = useState<"redeem_enter" | "cart_serial">("redeem_enter");
  const [qrWidth, setQrWidth] = useState(280);
  const [padding, setPadding] = useState(5);
  const [fontsize, setFontsize] = useState(12);
  const [barcodeScale, setBarcodeScale] = useState(1);

  const [rows, setRows] = useState<PrepaidGeneratedCard[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [decodeInput, setDecodeInput] = useState("");
  const [decoded, setDecoded] = useState<{ fields: Gs1Field[]; payload: string } | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const selected = rows[selectedIndex] ?? null;

  const qrImageSrc = useMemo(() => {
    if (!selected) return null;
    const q = new URLSearchParams({
      data: selected.qrPayload,
      width: String(qrWidth),
    });
    return `/api/admin/prepaid/qr-image?${q}`;
  }, [selected, qrWidth]);

  const barcodeImageSrc = useMemo(() => {
    if (!selected) return null;
    const q = new URLSearchParams({
      data: selected.barcodePayload,
      type: "code128",
      padding: String(padding),
      fontsize: String(fontsize),
      scale: String(barcodeScale),
    });
    return `/api/admin/prepaid/barcode-image?${q}`;
  }, [selected, padding, fontsize, barcodeScale]);

  const generate = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    setGenerateError(null);
    setCopyNotice(null);
    setDecoded(null);
    setDecodeError(null);
    try {
      const res = await fetch("/api/admin/prepaid/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          count,
          serialPrefix,
          serialStart,
          retailMarket,
          faceValueCents,
          gtin: mode === "gs1" ? gtin : undefined,
          lot: mode === "gs1" ? lot : undefined,
          expiryYymmdd: expiryYymmdd || undefined,
          qrUseFullUrl,
          qrTarget,
          voucherProductType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(typeof data.error === "string" ? data.error : "Generate failed.");
        return;
      }
      setRows(data.rows ?? []);
      setErrors(data.errors ?? []);
      setSelectedIndex(0);
    } catch {
      setGenerateError("Generate failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [
    mode,
    count,
    serialPrefix,
    serialStart,
    retailMarket,
    faceValueCents,
    gtin,
    lot,
    expiryYymmdd,
    qrUseFullUrl,
    qrTarget,
    voucherProductType,
  ]);

  async function decodePayload() {
    setDecodeError(null);
    setDecoded(null);
    try {
      const res = await fetch("/api/admin/prepaid/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: decodeInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDecodeError(data.error ?? "Decode failed");
        return;
      }
      setDecoded(data);
    } catch {
      setDecodeError("Decode failed");
    }
  }

  function downloadCsv() {
    if (rows.length === 0) return;
    const blob = new Blob([prepaidRowsToCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prepaid-cards-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyImportCsv() {
    if (rows.length === 0) return;
    setCopyNotice(null);
    try {
      await navigator.clipboard.writeText(prepaidRowsToCsv(rows));
      setCopyNotice("CSV copied — paste into Import prepaid cards.");
    } catch {
      setGenerateError("Could not copy to clipboard.");
    }
  }

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Vouchers" },
          { label: "Prepaid cards", href: "/admin/prepaid" },
          { label: "Generate" },
        ]}
        title="Generate QR & barcodes"
        description="Build a prepaid batch CSV with QR and Code 128 previews. Test mode for smoke tests; GS1 for production barcodes."
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            {rows.length > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200/90 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                <strong className="font-semibold">{rows.length}</strong> card{rows.length === 1 ? "" : "s"} generated
              </span>
            ) : (
              <span className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                {mode === "gs1" ? "GS1-128" : "Test"} mode
              </span>
            )}
            <Link
              href="/admin/prepaid"
              className="btn-secondary inline-flex h-9 items-center rounded-none px-3 text-xs no-underline"
            >
              Import prepaid cards
            </Link>
          </span>
        }
      />

      {generateError ? (
        <AdminFeedbackBanner
          variant="error"
          message={generateError}
          onDismiss={() => setGenerateError(null)}
        />
      ) : null}
      {copyNotice ? (
        <AdminFeedbackBanner
          variant="success"
          message={copyNotice}
          onDismiss={() => setCopyNotice(null)}
        />
      ) : null}
      {errors.length > 0 ? (
        <AdminFeedbackBanner
          variant="warning"
          message={
            <ul className="list-inside list-disc space-y-1">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          }
          onDismiss={() => setErrors([])}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form
          className="admin-panel"
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
        >
          <div className="space-y-6 p-5 md:p-6">
            <div className="admin-settings-block">
              <div className="admin-settings-block-head">
                <h2 className="admin-settings-block-title">Batch settings</h2>
                <p className="admin-settings-block-desc">
                  {mode === "gs1"
                    ? "GS1: (01) GTIN, (21) serial, (10) lot, (17) expiry on Code 128."
                    : "Test: barcode equals serial for dealer scanner smoke tests."}
                </p>
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-grid-span-2">
                  <label htmlFor="prepaid-gen-mode" className="ui-label !mt-0">
                    Mode
                  </label>
                  <select
                    id="prepaid-gen-mode"
                    className="ui-select !mt-1 max-w-md rounded-none"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as "test" | "gs1")}
                  >
                    <option value="test">Test (serial = barcode)</option>
                    <option value="gs1">GS1-128 template v1</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="prepaid-gen-count" className="ui-label !mt-0">
                    Cards to generate
                  </label>
                  <input
                    id="prepaid-gen-count"
                    type="number"
                    min={1}
                    max={500}
                    className="ui-input !mt-1 rounded-none"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="prepaid-gen-face" className="ui-label !mt-0">
                    Face value (cents)
                  </label>
                  <input
                    id="prepaid-gen-face"
                    type="number"
                    min={0}
                    className="ui-input !mt-1 rounded-none"
                    value={faceValueCents}
                    onChange={(e) => setFaceValueCents(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="prepaid-gen-prefix" className="ui-label !mt-0">
                    Serial prefix
                  </label>
                  <input
                    id="prepaid-gen-prefix"
                    className="ui-input !mt-1 rounded-none font-mono text-sm"
                    value={serialPrefix}
                    onChange={(e) => setSerialPrefix(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="prepaid-gen-start" className="ui-label !mt-0">
                    Serial start #
                  </label>
                  <input
                    id="prepaid-gen-start"
                    type="number"
                    min={0}
                    className="ui-input !mt-1 rounded-none"
                    value={serialStart}
                    onChange={(e) => setSerialStart(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="prepaid-gen-market" className="ui-label !mt-0">
                    Retail market
                  </label>
                  <select
                    id="prepaid-gen-market"
                    className="ui-select !mt-1 rounded-none"
                    value={retailMarket}
                    onChange={(e) => setRetailMarket(e.target.value)}
                  >
                    <option value="us">us</option>
                    <option value="br">br</option>
                    <option value="uk">uk</option>
                    <option value="global">global</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="prepaid-gen-vtype" className="ui-label !mt-0">
                    Voucher product type
                  </label>
                  <select
                    id="prepaid-gen-vtype"
                    className="ui-select !mt-1 rounded-none"
                    value={voucherProductType}
                    onChange={(e) => setVoucherProductType(e.target.value as "global" | "three_uk")}
                  >
                    <option value="global">Global (tier + network redeem)</option>
                    <option value="three_uk">Three UK exclusive</option>
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Scratch PINs use prefix{" "}
                    <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">
                      {voucherProductType === "three_uk" ? "USLTUK-" : "USL-G-"}
                    </code>{" "}
                    + random code (see <code className="font-mono text-[11px]">doc/scratch-pin-formats.md</code>).
                  </p>
                </div>
              </div>
            </div>

            {mode === "gs1" ? (
              <div className="admin-settings-block border-t border-slate-200 pt-6">
                <div className="admin-settings-block-head">
                  <h2 className="admin-settings-block-title">GS1 fields</h2>
                </div>
                <div className="admin-form-grid">
                  <div className="admin-form-grid-span-2">
                    <label htmlFor="prepaid-gen-gtin" className="ui-label !mt-0">
                      GTIN / UPC (12–14 digits)
                    </label>
                    <input
                      id="prepaid-gen-gtin"
                      className="ui-input !mt-1 rounded-none font-mono text-sm"
                      placeholder="012345678905"
                      value={gtin}
                      onChange={(e) => setGtin(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="prepaid-gen-lot" className="ui-label !mt-0">
                      Lot (AI 10)
                    </label>
                    <input
                      id="prepaid-gen-lot"
                      className="ui-input !mt-1 rounded-none font-mono text-sm"
                      value={lot}
                      onChange={(e) => setLot(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="prepaid-gen-expiry" className="ui-label !mt-0">
                      Expiry YYMMDD (AI 17)
                    </label>
                    <input
                      id="prepaid-gen-expiry"
                      className="ui-input !mt-1 rounded-none font-mono text-sm"
                      placeholder="261231"
                      value={expiryYymmdd}
                      onChange={(e) => setExpiryYymmdd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="admin-settings-block border-t border-slate-200 pt-6">
              <div className="admin-settings-block-head">
                <h2 className="admin-settings-block-title">QR encoding</h2>
              </div>
              <label className="admin-option-card">
                <input
                  type="checkbox"
                  checked={qrUseFullUrl}
                  onChange={(e) => setQrUseFullUrl(e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Full HTTPS URL in QR</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                    Recommended for printed cards. Unchecked encodes serial only (dealer smoke test).
                  </span>
                </span>
              </label>
              {qrUseFullUrl ? (
                <div className="mt-4">
                  <label htmlFor="prepaid-gen-qr-target" className="ui-label !mt-0">
                    QR destination
                  </label>
                  <select
                    id="prepaid-gen-qr-target"
                    className="ui-select !mt-1 rounded-none"
                    value={qrTarget}
                    onChange={(e) => setQrTarget(e.target.value as "redeem_enter" | "cart_serial")}
                  >
                    <option value="redeem_enter">Redeem — /redeem/enter</option>
                    <option value="cart_serial">Cart — /cart?serial=…</option>
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Customer scratches PIN on redeem; fixes bad printed URLs like www.redeem/voucher.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
              <button type="submit" disabled={loading} className="btn-primary h-10 rounded-none">
                {loading ? "Generating…" : "Generate batch"}
              </button>
              {rows.length > 0 ? (
                <>
                  <button type="button" className="btn-secondary h-10 rounded-none" onClick={downloadCsv}>
                    Download CSV
                  </button>
                  <button type="button" className="btn-secondary h-10 rounded-none" onClick={copyImportCsv}>
                    Copy for import
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </form>

        <section className="admin-panel">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Preview</h2>
              {rows.length > 0 ? (
                <select
                  className="ui-select max-w-xs rounded-none text-sm"
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(Number(e.target.value))}
                  aria-label="Select card to preview"
                >
                  {rows.map((r, i) => (
                    <option key={r.serial} value={i}>
                      {r.serial}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>
          {selected ? (
            <div className="space-y-6 p-5 md:p-6">
              <div className="rounded-none border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Image size</p>
                <p className="mt-1 text-xs text-slate-500">
                  Adjust sliders, then right-click images to save.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="ui-label !mt-0" htmlFor="prepaid-qr-width">
                      QR width (px) — {qrWidth}
                    </label>
                    <input
                      id="prepaid-qr-width"
                      type="range"
                      min={120}
                      max={640}
                      step={20}
                      value={qrWidth}
                      onChange={(e) => setQrWidth(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="ui-label !mt-0" htmlFor="prepaid-barcode-scale">
                      Barcode scale — {barcodeScale}×
                    </label>
                    <input
                      id="prepaid-barcode-scale"
                      type="range"
                      min={1}
                      max={4}
                      step={0.5}
                      value={barcodeScale}
                      onChange={(e) => setBarcodeScale(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="ui-label !mt-0" htmlFor="prepaid-barcode-padding">
                      Barcode padding — {padding}
                    </label>
                    <input
                      id="prepaid-barcode-padding"
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={padding}
                      onChange={(e) => setPadding(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="ui-label !mt-0" htmlFor="prepaid-barcode-fontsize">
                      Caption font — {fontsize}
                    </label>
                    <input
                      id="prepaid-barcode-fontsize"
                      type="range"
                      min={8}
                      max={24}
                      step={1}
                      value={fontsize}
                      onChange={(e) => setFontsize(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">QR (D2C / cart)</p>
                  {qrImageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrImageSrc}
                      alt="QR preview"
                      width={qrWidth}
                      height={qrWidth}
                      className="mt-2 rounded border border-slate-200 bg-white p-2"
                    />
                  ) : null}
                  <p className="mt-2 break-all font-mono text-[10px] text-slate-600">{selected.qrPayload}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Code 128 (POS)</p>
                  {barcodeImageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={barcodeImageSrc}
                      alt="Barcode preview"
                      className="mt-2 max-w-full rounded border border-slate-200 bg-white object-contain p-2"
                    />
                  ) : null}
                  <p className="mt-2 break-all font-mono text-[10px] text-slate-600">{selected.barcodePayload}</p>
                  {selected.gs1HumanReadable ? (
                    <p className="mt-1 text-[10px] text-muted">{selected.gs1HumanReadable}</p>
                  ) : null}
                </div>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                  <dt className="text-muted">Scratch PIN</dt>
                  <dd className="font-mono font-semibold text-amber-800">{selected.pin}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                  <dt className="text-muted">Serial (QR)</dt>
                  <dd className="font-mono">{selected.serial}</dd>
                </div>
              </dl>
              <p className="text-xs text-slate-500">
                After import, test dealer scan at{" "}
                <Link href="/dealer/scan" className="font-medium text-accent hover:underline">
                  /dealer/scan
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="admin-empty-state py-14 md:py-20" role="status">
              <div className="admin-empty-state-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                  <path strokeLinecap="round" d="M3.75 4.5h16.5M3.75 9h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                </svg>
              </div>
              <h3 className="admin-empty-state-title">No preview yet</h3>
              <p className="admin-empty-state-desc">Generate a batch to preview QR, barcode, and payloads.</p>
            </div>
          )}
        </section>
      </div>

      <section className="admin-panel">
        <div className="space-y-4 p-5 md:p-6">
          <div className="admin-settings-block">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">GS1 decoder</h2>
              <p className="admin-settings-block-desc">Paste a scanned Code 128 string to verify template v1 fields.</p>
            </div>
            <textarea
              className="ui-input min-h-[88px] w-full resize-y rounded-none font-mono text-xs"
              placeholder="Paste barcode scan value…"
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary mt-3 h-10 rounded-none"
              onClick={() => void decodePayload()}
            >
              Decode
            </button>
            {decodeError ? (
              <div className="mt-3">
                <AdminFeedbackBanner variant="error" message={decodeError} onDismiss={() => setDecodeError(null)} />
              </div>
            ) : null}
            {decoded ? (
              <div className="admin-table-wrap mt-4">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="pl-5 md:pl-6">AI</th>
                      <th>Field</th>
                      <th className="pr-5 md:pr-6">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decoded.fields.map((f) => (
                      <tr key={f.ai}>
                        <td className="pl-5 font-mono text-sm md:pl-6">{f.ai}</td>
                        <td>{f.label}</td>
                        <td className="pr-5 font-mono text-xs md:pr-6">{f.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </section>

    </div>
  );
}
