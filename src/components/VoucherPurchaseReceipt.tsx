"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { VoucherReceiptData } from "@/lib/voucher-receipt";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="voucher-receipt-row">
      <span className="voucher-receipt-label">{label}</span>
      <span className="voucher-receipt-value">{value}</span>
    </div>
  );
}

export function VoucherPurchaseReceipt({ data }: { data: VoucherReceiptData }) {
  const t = useTranslations("receipt");

  return (
    <div className="voucher-receipt-wrap">
      <div className="voucher-receipt-toolbar no-print">
        <button
          type="button"
          className="voucher-receipt-back-btn"
          onClick={() => window.history.back()}
        >
          {t("back")}
        </button>
        <button
          type="button"
          className="voucher-receipt-print-btn"
          onClick={() => window.print()}
        >
          {t("downloadPdf")}
        </button>
      </div>

      <article className="voucher-receipt" aria-label={t("documentLabel")}>
        <header className="voucher-receipt-header">
          <p className="voucher-receipt-logo">{data.distributor}</p>
          <span
            className={`voucher-receipt-status voucher-receipt-status--${data.status.toLowerCase()}`}
          >
            {data.status === "PAID" ? t("statusPaid") : t("statusPending")}
          </span>
        </header>

        <section className="voucher-receipt-meta">
          <DetailRow label={t("invoiceId")} value={data.invoiceId} />
          <DetailRow label={t("date")} value={data.date} />
          <DetailRow label={t("billTo")} value={data.billTo} />
        </section>

        <section className="voucher-receipt-section">
          <h2 className="voucher-receipt-section-title">{t("receiptDetails")}</h2>
          <DetailRow label={t("product")} value={data.product} />
          <DetailRow label={t("value")} value={data.valueReference} />
          <DetailRow label={t("voucherUsage")} value={data.voucherUsage} />
          <DetailRow label={t("serialReference")} value={data.serialReference} />
          <DetailRow label={t("paymentMethod")} value={data.paymentMethod} />
        </section>

        <section className="voucher-receipt-total">
          <span className="voucher-receipt-total-label">{t("totalCharged")}</span>
          <span className="voucher-receipt-total-value">{data.totalCharged}</span>
        </section>

        <div className="voucher-receipt-actions no-print">
          <button
            type="button"
            className="voucher-receipt-print-btn"
            onClick={() => window.print()}
          >
            {t("downloadPdf")}
          </button>
          <Link href={data.redeemHref} className="voucher-receipt-phase2-btn">
            {t("goPhase2")}
          </Link>
        </div>

        <footer className="voucher-receipt-support">
          {t("supportQuestion")}{" "}
          <a href={`mailto:${data.supportEmail}`} className="voucher-receipt-support-link">
            {data.supportEmail}
          </a>
        </footer>
      </article>
    </div>
  );
}
