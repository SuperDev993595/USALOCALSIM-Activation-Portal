"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
  const [lastSuccess, setLastSuccess] = useState<{ redeemUrl: string; serial: string } | null>(null);
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
        scrollToResult("feedback");
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
      };
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? t("activateFailed") });
        return;
      }
      setMessage({ type: "ok", text: t("activateSuccess") });
      setLastSuccess({
        redeemUrl: typeof data.redeemUrl === "string" ? data.redeemUrl : "",
        serial: preview.serial,
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
    <div className="mx-auto max-w-lg">
      <DealerPageHeader title={t("scanTitle")} description={t("scanSubtitle")} />
      <p className="mt-2 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-950">
        {t("scanTourismNote")}
      </p>

      {loading === "preview" || message ? (
        <div ref={feedbackRef} className="mt-4" aria-live="polite" aria-atomic="true">
          {loading === "preview" ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              {t("lookingUp")}
            </p>
          ) : null}
          {message ? (
            <p
              className={`rounded-md border px-3 py-3 text-sm ${
                loading === "preview" ? "mt-2" : ""
              } ${
                message.type === "ok"
                  ? "border-accent/35 bg-accent/10 text-accent"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </p>
          ) : null}
        </div>
      ) : null}

      {lastSuccess?.redeemUrl ? (
        <div className="ui-card mt-4 rounded-xl p-4 text-sm">
          <p className="font-medium text-slate-900">{t("lastSale")}</p>
          <p className="mt-1 font-mono text-xs text-slate-600">{lastSuccess.serial}</p>
          <a href={lastSuccess.redeemUrl} className="link-accent mt-2 inline-block break-all text-xs">
            {t("customerRedeemLink")}
          </a>
        </div>
      ) : null}

      <div className="ui-card mt-4 space-y-4 rounded-xl p-4">
        <h2 className="font-semibold text-slate-900">{t("cameraTitle")}</h2>
        {cameraSupported ? (
          <>
            <div
              className={`overflow-hidden rounded-lg border border-slate-200 bg-black ${
                cameraOn ? "" : "hidden"
              }`}
            >
              <video
                ref={videoRef}
                className="aspect-[4/3] w-full object-cover"
                muted
                playsInline
                aria-labelledby={regionId}
              />
            </div>
            <p id={regionId} className="sr-only">
              {t("cameraAria")}
            </p>
            {cameraError ? <p className="text-sm text-red-600">{cameraError}</p> : null}
            <button
              type="button"
              className="btn-primary w-full rounded-xl"
              onClick={() => (cameraOn ? stopCamera() : void startCamera())}
            >
              {cameraOn ? t("stopCamera") : t("startCamera")}
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-600">{t("cameraUnsupported")}</p>
        )}
      </div>

      <div className="ui-card mt-6 space-y-4 rounded-xl p-4">
        <h2 className="font-semibold text-slate-900">{t("manualTitle")}</h2>
        <div>
          <label className="ui-label !mt-0">{t("scanTypeLabel")}</label>
          <select
            className="ui-select"
            value={scanType}
            onChange={(e) => setScanType(e.target.value as ScanType)}
          >
            <option value="serial">{t("scanTypeSerial")}</option>
            <option value="barcode">{t("scanTypeBarcode")}</option>
          </select>
        </div>
        <div>
          <label className="ui-label !mt-0" htmlFor="dealer-scan-value">
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
          <p className="mt-1 text-xs text-slate-500">{t("scanValueHint")}</p>
        </div>
        <button
          type="button"
          className="btn-primary w-full rounded-xl disabled:opacity-50"
          disabled={loading !== null || !scanValue.trim()}
          onClick={() => void lookupCard()}
        >
          {loading === "preview" ? t("lookingUp") : t("lookupCard")}
        </button>
      </div>

      {preview ? (
        <div ref={previewRef} className="ui-card mt-6 space-y-4 rounded-xl p-4">
          <h2 className="font-semibold text-slate-900">{t("cardPreviewTitle")}</h2>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">{t("fieldSerial")}</dt>
              <dd className="font-mono text-xs font-medium text-slate-900">{preview.serial}</dd>
            </div>
            {preview.barcodePayload ? (
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">{t("fieldBarcode")}</dt>
                <dd className="font-mono text-xs text-slate-900">{preview.barcodePayload}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">{t("fieldMarket")}</dt>
              <dd className="uppercase text-slate-900">{preview.retailMarket}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">{t("fieldAmount")}</dt>
              <dd className="font-semibold text-slate-900">
                {formatMoney(preview.faceValueCents, preview.retailMarket)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">{t("fieldStatus")}</dt>
              <dd className="capitalize text-slate-900">
                {preview.alreadyPaid ? t("statusEligible") : t("statusInactive")}
              </dd>
            </div>
          </dl>

          {!preview.alreadyPaid ? (
            <>
              <div>
                <label className="ui-label !mt-0" htmlFor="dealer-receipt">
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
                <label className="ui-label !mt-0" htmlFor="dealer-email">
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
                className="btn-primary w-full rounded-xl disabled:opacity-50"
                disabled={loading !== null || !canActivate}
                onClick={() => void confirmSale()}
              >
                {loading === "activate" ? t("activating") : t("confirmSale")}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
