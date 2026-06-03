"use client";

import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
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
        alert(data.error ?? "Generate failed");
        return;
      }
      setRows(data.rows ?? []);
      setErrors(data.errors ?? []);
      setSelectedIndex(0);
    } catch {
      alert("Generate failed");
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

  function copyImportCsv() {
    if (rows.length === 0) return;
    void navigator.clipboard.writeText(prepaidRowsToCsv(rows));
    alert("CSV copied — paste into Import prepaid cards.");
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
        meta={
          <Link href="/admin/prepaid" className="text-sm font-medium text-accent hover:underline">
            ← Import prepaid cards
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          className="admin-panel space-y-0 overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
        >
          <div className="admin-panel-head">
            <h2 className="admin-panel-head-title">Batch settings</h2>
            <p className="admin-panel-head-desc text-xs">
              Test mode: barcode = serial (dealer scanner smoke test). GS1 mode: (01) GTIN + (21) serial + (10) lot +
              (17) expiry.
            </p>
          </div>
          <div className="divide-y divide-slate-100 px-6 py-5 md:px-8">
            <div className="pb-5">
              <label className="ui-label">Mode</label>
              <select className="ui-select" value={mode} onChange={(e) => setMode(e.target.value as "test" | "gs1")}>
                <option value="test">Test (serial = barcode)</option>
                <option value="gs1">GS1-128 template v1</option>
              </select>
            </div>
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <div>
                <label className="ui-label">Cards to generate</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className="ui-input"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="ui-label">Face value (cents)</label>
                <input
                  type="number"
                  min={0}
                  className="ui-input"
                  value={faceValueCents}
                  onChange={(e) => setFaceValueCents(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <div>
                <label className="ui-label">Serial prefix</label>
                <input className="ui-input font-mono text-sm" value={serialPrefix} onChange={(e) => setSerialPrefix(e.target.value)} />
              </div>
              <div>
                <label className="ui-label">Serial start #</label>
                <input
                  type="number"
                  min={0}
                  className="ui-input"
                  value={serialStart}
                  onChange={(e) => setSerialStart(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <div>
                <label className="ui-label">Retail market</label>
                <select className="ui-select" value={retailMarket} onChange={(e) => setRetailMarket(e.target.value)}>
                  <option value="us">us</option>
                  <option value="br">br</option>
                  <option value="uk">uk</option>
                  <option value="global">global</option>
                </select>
              </div>
              <div>
                <label className="ui-label">Voucher product type</label>
                <select
                  className="ui-select"
                  value={voucherProductType}
                  onChange={(e) => setVoucherProductType(e.target.value as "global" | "three_uk")}
                >
                  <option value="global">Global (tier + network redeem)</option>
                  <option value="three_uk">Three UK exclusive</option>
                </select>
              </div>
            </div>
            {mode === "gs1" ? (
              <>
                <div className="pb-5">
                  <label className="ui-label">GTIN / UPC (12–14 digits from GS1)</label>
                  <input
                    className="ui-input font-mono text-sm"
                    placeholder="012345678905"
                    value={gtin}
                    onChange={(e) => setGtin(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 pb-5 sm:grid-cols-2">
                  <div>
                    <label className="ui-label">Lot (AI 10)</label>
                    <input className="ui-input font-mono text-sm" value={lot} onChange={(e) => setLot(e.target.value)} />
                  </div>
                  <div>
                    <label className="ui-label">Expiry YYMMDD (AI 17)</label>
                    <input
                      className="ui-input font-mono text-sm"
                      placeholder="261231"
                      value={expiryYymmdd}
                      onChange={(e) => setExpiryYymmdd(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : null}
            <div className="space-y-3 pb-5">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={qrUseFullUrl} onChange={(e) => setQrUseFullUrl(e.target.checked)} />
                QR encodes full HTTPS URL (recommended for printed cards)
              </label>
              {qrUseFullUrl ? (
                <div>
                  <label className="ui-label">QR destination</label>
                  <select
                    className="ui-select"
                    value={qrTarget}
                    onChange={(e) => setQrTarget(e.target.value as "redeem_enter" | "cart_serial")}
                  >
                    <option value="redeem_enter">Redeem portal — /redeem/enter (production default)</option>
                    <option value="cart_serial">D2C cart — /cart?serial=… (scan-to-pay)</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Replaces invalid printed URL <code className="rounded bg-slate-100 px-1">www.redeem/voucher</code>.
                    Customer scratches PIN on the redeem page.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">QR encodes serial only (dealer barcode smoke test).</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-5 md:px-8">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Generating…" : "Generate batch"}
            </button>
            {rows.length > 0 ? (
              <>
                <button type="button" className="btn-secondary" onClick={downloadCsv}>
                  Download CSV
                </button>
                <button type="button" className="btn-secondary" onClick={copyImportCsv}>
                  Copy CSV for import
                </button>
              </>
            ) : null}
          </div>
          {errors.length > 0 ? (
            <ul className="border-t border-amber-200 bg-amber-50 px-6 py-3 text-xs text-amber-900 md:px-8">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}
        </form>

        <div className="admin-panel overflow-hidden">
          <div className="admin-panel-head">
            <h2 className="admin-panel-head-title">Preview</h2>
            {rows.length > 0 ? (
              <select
                className="ui-select mt-2 max-w-xs text-sm"
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
              >
                {rows.map((r, i) => (
                  <option key={r.serial} value={i}>
                    {r.serial}
                  </option>
                ))}
              </select>
            ) : (
              <p className="admin-panel-head-desc text-xs">Generate cards to preview images and payloads.</p>
            )}
          </div>
          {selected ? (
            <div className="space-y-6 px-6 py-6 md:px-8">
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Image size (preview)</p>
                <p className="mt-1 text-[11px] text-muted">
                  Adjust then right-click images to save. QR size is PNG pixels; barcode uses Orca scale.
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
              <p className="text-xs text-muted-dim">
                Test dealer scan: paste barcode into{" "}
                <Link href="/dealer/scan" className="text-accent hover:underline">
                  /dealer
                </Link>{" "}
                after import.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="admin-panel max-w-3xl overflow-hidden">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">GS1 decoder</h2>
          <p className="admin-panel-head-desc text-xs">Paste a scanned Code 128 string to verify template v1 fields.</p>
        </div>
        <div className="space-y-4 px-6 py-5 md:px-8">
          <textarea
            className="ui-textarea min-h-[80px] font-mono text-xs"
            placeholder="Paste barcode scan value…"
            value={decodeInput}
            onChange={(e) => setDecodeInput(e.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={() => void decodePayload()}>
            Decode
          </button>
          {decodeError ? <p className="text-sm text-red-600">{decodeError}</p> : null}
          {decoded ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted">
                  <th className="py-2">AI</th>
                  <th className="py-2">Field</th>
                  <th className="py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {decoded.fields.map((f) => (
                  <tr key={f.ai} className="border-b border-slate-50">
                    <td className="py-2 font-mono">{f.ai}</td>
                    <td className="py-2">{f.label}</td>
                    <td className="py-2 font-mono text-xs">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>

      <AdminPageFooter />
    </div>
  );
}
