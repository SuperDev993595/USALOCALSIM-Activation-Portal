"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { DealerPageHeader } from "@/components/DealerPageHeader";

type ScanType = "serial" | "barcode";

type CardPreview = {
  serial: string;
  barcodePayload: string | null;
  retailMarket: string;
  faceValueCents: number;
  voucherStatus: string;
  paymentStatus: boolean;
  alreadyPaid: boolean;
};

function formatMoney(cents: number, market: string) {
  const amount = (cents / 100).toFixed(2);
  if (market === "br") return `R$ ${amount}`;
  if (market === "uk") return `£ ${amount}`;
  return `$ ${amount}`;
}

export function DealerScanClient() {
  const t = useTranslations("dealer");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const scannerControlsRef = useRef<import("@zxing/browser").IScannerControls | null>(null);
  const regionId = useId();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [scanType, setScanType] = useState<ScanType>("serial");
  const [scanValue, setScanValue] = useState("");
  const [receiptRef, setReceiptRef] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [preview, setPreview] = useState<CardPreview | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{
    redeemUrl: string;
    serial: string;
    purchaseId: string;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState<"preview" | "activate" | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    setCameraSupported(
      typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function",
    );
  }, []);

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current != null) {
      window.cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const applyScanValue = useCallback((raw: string, type: ScanType) => {
    setScanType(type);
    setScanValue(raw.trim());
    setPreview(null);
    setMessage(null);
  }, []);

  const onCodeDetected = useCallback(
    (raw: string, isLikelyQr: boolean) => {
      applyScanValue(raw, isLikelyQr ? "serial" : "barcode");
      stopCamera();
      setMessage({ type: "ok", text: t("scanDetected") });
    },
    [applyScanValue, stopCamera, t],
  );

  const startNativeScanner = useCallback(
    (video: HTMLVideoElement) => {
      // @ts-expect-error BarcodeDetector is not in all TS libs
      const detector = new BarcodeDetector({
        formats: ["qr_code", "ean_13", "ean_8", "code_128", "upc_a", "upc_e"],
      });

      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes[0]?.rawValue?.trim();
          if (raw) {
            const isLikelyQr = codes[0].format?.toLowerCase().includes("qr");
            onCodeDetected(raw, isLikelyQr);
            return;
          }
        } catch {
          /* ignore frame errors */
        }
        scanLoopRef.current = window.requestAnimationFrame(tick);
      };
      scanLoopRef.current = window.requestAnimationFrame(tick);
    },
    [onCodeDetected],
  );

  const startZxingScanner = useCallback(
    async (video: HTMLVideoElement) => {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      scannerControlsRef.current = await reader.decodeFromVideoDevice(undefined, video, (result) => {
        if (!result) return;
        const raw = result.getText()?.trim();
        if (!raw) return;
        const format = result.getBarcodeFormat()?.toString().toLowerCase() ?? "";
        onCodeDetected(raw, format.includes("qr"));
      });
    },
    [onCodeDetected],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();
    const video = videoRef.current;
    if (!video) return;

    try {
      setCameraOn(true);
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        startNativeScanner(video);
      } else {
        await startZxingScanner(video);
        streamRef.current = (video.srcObject as MediaStream | null) ?? null;
        if (!streamRef.current) {
          throw new Error("no camera stream");
        }
      }
    } catch {
      setCameraError(t("cameraDenied"));
      setCameraOn(false);
      stopCamera();
    }
  }, [startNativeScanner, startZxingScanner, stopCamera, t]);

  const scrollToResult = useCallback((target: "feedback" | "preview") => {
    requestAnimationFrame(() => {
      const el = target === "preview" ? previewRef.current : feedbackRef.current;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  async function lookupCard() {
    const value = scanValue.trim();
    if (!value) {
      setMessage({ type: "err", text: t("enterScanValue") });
      scrollToResult("feedback");
      return;
    }
    setLoading("preview");
    setMessage(null);
    setPreview(null);
    try {
      const res = await fetch(
        `/api/dealer/prepaid-preview?scanType=${encodeURIComponent(scanType)}&scanValue=${encodeURIComponent(value)}`,
        { credentials: "same-origin" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        card?: CardPreview;
      };
      if (!res.ok || !data.card) {
        const errText =
          res.status === 401
            ? t("sessionExpired")
            : res.status === 404
              ? t("cardNotFoundHint")
              : typeof data.error === "string"
                ? data.error
                : t("cardNotFound");
        setMessage({ type: "err", text: errText });
        scrollToResult("feedback");
        return;
      }
      setPreview(data.card);
      if (data.card.alreadyPaid) {
        setMessage({ type: "err", text: t("alreadyPaid") });
        scrollToResult("preview");
      } else if (value.toUpperCase() !== data.card.serial.toUpperCase()) {
        setMessage({ type: "ok", text: t("resolvedViaPin", { serial: data.card.serial }) });
        scrollToResult("preview");
      } else {
        setMessage(null);
        scrollToResult("preview");
      }
    } catch {
      setMessage({ type: "err", text: t("requestFailed") });
      scrollToResult("feedback");
    } finally {
      setLoading(null);
    }
  }

  async function confirmSale() {
    if (!preview || preview.alreadyPaid) return;
    const value = scanValue.trim();
    if (!value) return;
    setLoading("activate");
    setMessage(null);
    try {
      const res = await fetch("/api/dealer/pos-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanType,
          scanValue: value,
          amountCents: preview.faceValueCents,
          externalPaymentId: receiptRef.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redeemUrl?: string;
        creditAmountCents?: number;
        purchaseId?: string;
      };
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? t("activateFailed") });
        return;
      }
      setMessage({ type: "ok", text: t("activateSuccess") });
      setLastSuccess({
        redeemUrl: typeof data.redeemUrl === "string" ? data.redeemUrl : "",
        serial: preview.serial,
        purchaseId: typeof data.purchaseId === "string" ? data.purchaseId : "",
      });
      setPreview(null);
      setScanValue("");
      setReceiptRef("");
      setCustomerEmail("");
    } catch {
      setMessage({ type: "err", text: t("requestFailed") });
    } finally {
      setLoading(null);
    }
  }

  const canActivate = preview && !preview.alreadyPaid && preview.faceValueCents > 0;

  return (
    <div className="dealer-scan-page">
      <DealerPageHeader title={t("scanTitle")} description={t("scanSubtitle")} />
      <p className="dealer-scan-note">{t("scanTourismNote")}</p>

      <div ref={feedbackRef} className="space-y-3" aria-live="polite" aria-atomic="true">
        {loading === "preview" ? (
          <AdminFeedbackBanner variant="info" message={t("lookingUp")} />
        ) : null}
        {message ? (
          <AdminFeedbackBanner
            variant={message.type === "ok" ? "success" : "error"}
            message={message.text}
            onDismiss={() => setMessage(null)}
          />
        ) : null}
        {lastSuccess?.redeemUrl ? (
          <AdminFeedbackBanner
            variant="success"
            message={
              <span>
                <span className="font-medium">{t("lastSale")}</span>
                <span className="mt-1 block font-mono text-xs opacity-90">{lastSuccess.serial}</span>
                <a href={lastSuccess.redeemUrl} className="link-accent mt-2 inline-block break-all text-xs">
                  {t("customerRedeemLink")}
                </a>
                {lastSuccess.purchaseId ? (
                  <a
                    href={`/invoice/${lastSuccess.purchaseId}`}
                    className="link-accent mt-2 block text-xs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("viewInvoice")}
                  </a>
                ) : null}
              </span>
            }
            onDismiss={() => setLastSuccess(null)}
          />
        ) : null}
      </div>

      <div className="dealer-scan-layout">
        <section className="dealer-scan-panel">
          <div className="dealer-scan-panel-head">
            <h2 className="dealer-scan-panel-title">{t("scanStepScan")}</h2>
            <p className="dealer-scan-panel-desc">{t("scanStepScanDesc")}</p>
          </div>

          {cameraSupported ? (
            <>
              {cameraOn ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
                  <video
                    ref={videoRef}
                    className="aspect-[4/3] w-full object-cover"
                    muted
                    playsInline
                    aria-labelledby={regionId}
                  />
                </div>
              ) : (
                <div className="dealer-scan-camera-off">{t("startCamera")}</div>
              )}
              <p id={regionId} className="sr-only">
                {t("cameraAria")}
              </p>
              {cameraError ? (
                <AdminFeedbackBanner variant="error" message={cameraError} onDismiss={() => setCameraError(null)} />
              ) : null}
              <button
                type="button"
                className={cameraOn ? "btn-secondary w-full" : "btn-primary w-full"}
                onClick={() => (cameraOn ? stopCamera() : void startCamera())}
              >
                {cameraOn ? t("stopCamera") : t("startCamera")}
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-600">{t("cameraUnsupported")}</p>
          )}

          <div className="dealer-scan-divider space-y-4">
            <div>
              <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="dealer-scan-type">
                {t("scanTypeLabel")}
              </label>
              <select
                id="dealer-scan-type"
                className="ui-select !mt-1"
                value={scanType}
                onChange={(e) => setScanType(e.target.value as ScanType)}
              >
                <option value="serial">{t("scanTypeSerial")}</option>
                <option value="barcode">{t("scanTypeBarcode")}</option>
              </select>
            </div>
            <div>
              <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="dealer-scan-value">
                {t("scanValueLabel")}
              </label>
              <input
                id="dealer-scan-value"
                type="text"
                className="ui-input !mt-1 font-mono uppercase"
                value={scanValue}
                onChange={(e) => {
                  setScanValue(e.target.value);
                  setPreview(null);
                }}
                placeholder={t("scanValuePlaceholder")}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (loading === null && scanValue.trim()) void lookupCard();
                  }
                }}
              />
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{t("scanValueHint")}</p>
            </div>
            <button
              type="button"
              className="btn-primary w-full disabled:opacity-50"
              disabled={loading !== null || !scanValue.trim()}
              onClick={() => void lookupCard()}
            >
              {loading === "preview" ? t("lookingUp") : t("lookupCard")}
            </button>
          </div>
        </section>

        <section ref={previewRef} className="lg:sticky lg:top-4">
          {preview ? (
            <div className="dealer-scan-panel space-y-4">
              <div className="dealer-scan-panel-head">
                <h2 className="dealer-scan-panel-title">{t("scanStepConfirm")}</h2>
                <p className="dealer-scan-panel-desc">{t("cardPreviewTitle")}</p>
              </div>

              <div className="dealer-scan-preview-hero">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("fieldAmount")}</p>
                <p className="dealer-scan-amount">{formatMoney(preview.faceValueCents, preview.retailMarket)}</p>
                <span
                  className={
                    preview.alreadyPaid
                      ? "dealer-scan-status-badge dealer-scan-status-badge--paid mt-2"
                      : "dealer-scan-status-badge dealer-scan-status-badge--ready mt-2"
                  }
                >
                  {preview.alreadyPaid ? t("statusEligible") : t("statusInactive")}
                </span>
              </div>

              <dl className="dealer-scan-dl">
                <div className="dealer-scan-dl-row">
                  <dt>{t("fieldSerial")}</dt>
                  <dd className="font-mono text-xs">{preview.serial}</dd>
                </div>
                {preview.barcodePayload ? (
                  <div className="dealer-scan-dl-row">
                    <dt>{t("fieldBarcode")}</dt>
                    <dd className="font-mono text-xs">{preview.barcodePayload}</dd>
                  </div>
                ) : null}
                <div className="dealer-scan-dl-row">
                  <dt>{t("fieldMarket")}</dt>
                  <dd className="uppercase">{preview.retailMarket}</dd>
                </div>
              </dl>

              {!preview.alreadyPaid ? (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div>
                    <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="dealer-receipt">
                      {t("receiptRefLabel")}
                    </label>
                    <input
                      id="dealer-receipt"
                      type="text"
                      className="ui-input !mt-1"
                      value={receiptRef}
                      onChange={(e) => setReceiptRef(e.target.value)}
                      placeholder={t("receiptRefPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="dealer-email">
                      {t("customerEmailOptional")}
                    </label>
                    <input
                      id="dealer-email"
                      type="email"
                      className="ui-input !mt-1"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={t("customerEmailPlaceholder")}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full disabled:opacity-50"
                    disabled={loading !== null || !canActivate}
                    onClick={() => void confirmSale()}
                  >
                    {loading === "activate" ? t("activating") : t("confirmSale")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="dealer-scan-preview-empty">
              <p>{t("scanEmptyPreview")}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
