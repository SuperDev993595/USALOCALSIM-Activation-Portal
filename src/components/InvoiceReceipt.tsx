"use client";

import { useTranslations } from "next-intl";
import type { InvoiceData } from "@/lib/invoice";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="invoice-receipt-row">
      <span className="invoice-receipt-label">{label}</span>
      <span className="invoice-receipt-value">{value}</span>
    </div>
  );
}

function OptionalRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "NA") return null;
  return <Row label={label} value={value} />;
}

export function InvoiceReceipt({ data }: { data: InvoiceData }) {
  const t = useTranslations("invoice");
  const priceLabel = (base: string) => `${base} (${data.priceCurrencySymbol})`;

  return (
    <div className="invoice-receipt-wrap">
      <div className="invoice-receipt-toolbar no-print">
        <button type="button" className="invoice-receipt-back-btn" onClick={() => window.history.back()}>
          {t("back")}
        </button>
        <button type="button" className="invoice-receipt-print-btn" onClick={() => window.print()}>
          {t("print")}
        </button>
      </div>

      <article className="invoice-receipt" aria-label={t("documentLabel")}>
        <header className="invoice-receipt-brand">
          <p className="invoice-receipt-brand-name">{data.distributor}</p>
          <p className="invoice-receipt-brand-sub">{t("retailReceipt")}</p>
        </header>

        <section className="invoice-receipt-section">
          <Row label="DISTRIBUTOR" value={data.distributor} />
          <OptionalRow label="CUSTOMER" value={data.customerName} />
          <OptionalRow label="EMAIL" value={data.customerEmail} />
          <Row label="PAYMENT" value={data.paymentMethod} />
          <Row label="TYPE" value={data.type} />
          <Row label="SERIALNUMBER" value={data.serialNumber} />
          <OptionalRow label="ICCID" value={data.iccid} />
          <Row label="IMEI #" value={data.imei} />
          <Row label="MSISDN #" value={data.msisdn} />
          <Row label="NETWORK" value={data.network} />
          <Row label="PLANDESC" value={data.planDesc} />
          <Row label={priceLabel("PLAN PRICE")} value={data.planPrice} />
          <Row label="MONTHS" value={String(data.months)} />
          <Row label={priceLabel("TOTAL PRICE")} value={data.totalPrice} />
          <Row label={priceLabel("CUSTOMER PRICE")} value={data.customerPrice} />
          <div className="invoice-receipt-row invoice-receipt-row--partner" role="group" aria-label="Partner fields">
            <span className="invoice-receipt-partner-field">
              <span className="invoice-receipt-label">P_MSISDN #</span>
              <span className="invoice-receipt-value">{data.partnerMsisdn}</span>
            </span>
            <span className="invoice-receipt-partner-field">
              <span className="invoice-receipt-label">P_ACCOUNT #</span>
              <span className="invoice-receipt-value">{data.partnerAccount}</span>
            </span>
            <span className="invoice-receipt-partner-field">
              <span className="invoice-receipt-label">P_PIN #</span>
              <span className="invoice-receipt-value">{data.partnerPin}</span>
            </span>
          </div>
        </section>

        <section className="invoice-receipt-section invoice-receipt-section--footer">
          <h1 className="invoice-receipt-title">{t("title")}</h1>
          <Row label="Transaction Date" value={data.transactionDate} />
          <Row label="Transaction ID" value={data.transactionId} />
          <Row label="Transaction Status" value={data.transactionStatus} />
          <Row label="Status" value={data.status} />
        </section>

        {data.supportEmail ? (
          <footer className="invoice-receipt-support no-print">
            {t("supportPrefix")}{" "}
            <a href={`mailto:${data.supportEmail}`} className="invoice-receipt-support-link">
              {data.supportEmail}
            </a>
          </footer>
        ) : null}
      </article>
    </div>
  );
}
