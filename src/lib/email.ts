import nodemailer from "nodemailer";
import QRCode from "qrcode";
import {
  ACTIVATION_SCENARIO_CART_VOUCHER,
  ACTIVATION_SCENARIO_CART_VOUCHER_LEGACY,
} from "@/lib/stripe-cart-flow";
import { formatPaidAmountForEmail } from "@/lib/invoice";

function getTransport() {
  if (process.env.RESEND_API_KEY) {
    return null;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

export type PlanEmailInfo = {
  name: string;
  dataAllowance: string;
  durationDays: number;
  planType: string;
  market: string;
  scenario: string;
  esimQrPayload?: string;
};

function variantParagraph(plan: PlanEmailInfo): string {
  if (plan.scenario === "esim_voucher" || plan.planType === "esim") {
    return `This message confirms your eSIM package (${plan.name}). If a QR code is attached, scan it with your device to install the eSIM profile.`;
  }
  if (plan.scenario === "combo") {
    return `This message confirms your physical SIM top-up (${plan.name}). Your data allowance is active on the ICCID you provided.`;
  }
  if (
    plan.scenario === ACTIVATION_SCENARIO_CART_VOUCHER ||
    plan.scenario === ACTIVATION_SCENARIO_CART_VOUCHER_LEGACY
  ) {
    return `This message confirms your physical SIM plan (${plan.name}) after your cart purchase and voucher activation.`;
  }
  return `This message confirms your physical SIM activation (${plan.name}). Your plan is now active.`;
}

async function qrPngBuffer(payload: string): Promise<Buffer | null> {
  try {
    return await QRCode.toBuffer(payload.trim(), {
      type: "png",
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  } catch {
    return null;
  }
}

/** Plan-specific success email: copy matches plan fields; variant text by plan type / scenario. Optional eSIM QR in HTML (data URI) + attachment. */
export async function sendSuccessEmail(
  to: string,
  plan: PlanEmailInfo,
  _locale?: string
): Promise<{ ok: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";
  const subject = `Your USALOCALSIM service is now active – ${plan.name}`;
  const intro = variantParagraph(plan);
  const details = `Plan: ${plan.name}\nData allowance: ${plan.dataAllowance}\nDuration: ${plan.durationDays} days`;
  const footer = "\n\nThank you for choosing USALOCALSIM.";

  let png: Buffer | null = null;
  if (plan.esimQrPayload?.trim()) {
    png = await qrPngBuffer(plan.esimQrPayload);
  }
  const qrNote = png
    ? "\n\nAn eSIM QR code image is attached (or shown below in HTML-capable clients)."
    : plan.esimQrPayload?.trim()
      ? "\n\nWe could not generate a QR image from the provided payload; use the activation details above or contact support."
      : "";

  const text = `${intro}\n\n${details}${qrNote}${footer}`;

  const htmlParts = [
    `<p>${intro}</p>`,
    `<ul><li><strong>Plan:</strong> ${escapeHtml(plan.name)}</li>`,
    `<li><strong>Data allowance:</strong> ${escapeHtml(plan.dataAllowance)}</li>`,
    `<li><strong>Duration:</strong> ${plan.durationDays} days</li></ul>`,
  ];
  if (png) {
    const b64 = png.toString("base64");
    htmlParts.push(
      `<p><img src="data:image/png;base64,${b64}" alt="eSIM QR code" width="320" height="320" /></p>`
    );
  }
  htmlParts.push(`<p>${escapeHtml("Thank you for choosing USALOCALSIM.")}</p>`);
  const html = htmlParts.join("");

  const attachments: nodemailer.SendMailOptions["attachments"] = png
    ? [{ filename: "esim-qr.png", content: png }]
    : undefined;

  const transport = getTransport();
  if (transport) {
    try {
      await transport.sendMail({
        from,
        to,
        subject,
        text,
        html,
        attachments,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const body: Record<string, unknown> = {
        from,
        to,
        subject,
        text,
        html,
      };
      if (png) {
        body.attachments = [
          { filename: "esim-qr.png", content: png.toString("base64") },
        ];
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.message ?? res.statusText };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
    }
  }

  console.warn("No email transport; success email not sent to", to);
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type SimpleMail = { to: string; subject: string; text: string; html: string };

async function deliverSimpleMail(opts: SimpleMail): Promise<{ ok: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";
  const transport = getTransport();
  if (transport) {
    try {
      await transport.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        return { ok: false, error: data.message ?? res.statusText };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
    }
  }

  console.warn("No email transport; password change email not sent to", opts.to);
  return { ok: false, error: "Email is not configured (SMTP or RESEND_API_KEY)." };
}

export async function sendPasswordChangeCodeEmail(
  to: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const subject = "Your USALOCALSIM password change code";
  const text = `Your verification code is: ${code}\n\nThis code expires in 15 minutes. If you did not request a password change, ignore this email.\n`;
  const html = `<p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:0.2em">${escapeHtml(code)}</p><p>This code expires in 15 minutes.</p><p>If you did not request a password change, you can ignore this email.</p>`;
  return deliverSimpleMail({ to, subject, text, html });
}

export async function sendAdminUserDeleteCodeEmail(
  to: string,
  code: string,
  targetEmail: string,
): Promise<{ ok: boolean; error?: string }> {
  const subject = "Your USALOCALSIM user delete verification code";
  const text =
    `You requested to delete user: ${targetEmail}\n\n` +
    `Your verification code is: ${code}\n\n` +
    "This code expires in 15 minutes. If you did not request this action, ignore this email.\n";
  const html =
    `<p>You requested to delete user: <strong>${escapeHtml(targetEmail)}</strong></p>` +
    "<p>Your verification code is:</p>" +
    `<p style="font-size:24px;font-weight:bold;letter-spacing:0.2em">${escapeHtml(code)}</p>` +
    "<p>This code expires in 15 minutes.</p>" +
    "<p>If you did not request this action, you can ignore this email.</p>";
  return deliverSimpleMail({ to, subject, text, html });
}

export async function sendCartPurchasePaidEmail(opts: {
  to: string;
  planName: string;
  resumeUrl: string;
  /** PIN + date only — no SMS step (keep this link private). */
  directRedeemUrl?: string;
  /** Consumer purchase receipt (credit checkout). Preferred over invoice when set. */
  receiptUrl?: string;
  invoiceUrl?: string;
  amountPaidCents?: number;
  transactionId?: string;
  amountMarket?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const subject = `USALOCALSIM — payment received (${opts.planName})`;
  const direct = opts.directRedeemUrl?.trim();
  const receipt = opts.receiptUrl?.trim();
  const invoice = opts.invoiceUrl?.trim();
  const documentUrl = receipt || invoice;
  const documentText = receipt
    ? `View or print your purchase receipt:\n${receipt}\n\n`
    : invoice
      ? `View or print your invoice:\n${invoice}\n\n`
      : "";
  const documentHtml = documentUrl
    ? receipt
      ? `<p><a href="${escapeHtml(receipt)}">View or print your purchase receipt</a></p>`
      : `<p><a href="${escapeHtml(invoice!)}">View or print your invoice</a></p>`
    : "";
  const amountFormatted =
    opts.amountPaidCents != null
      ? formatPaidAmountForEmail(opts.amountPaidCents, opts.amountMarket ?? "us")
      : null;
  const amountLine = amountFormatted ? `Amount paid: ${amountFormatted}\n` : "";
  const txnLine = opts.transactionId?.trim()
    ? `Transaction ID: ${opts.transactionId.trim()}\n`
    : "";
  const text =
    `Thank you for your purchase.\n\n` +
    `Plan: ${opts.planName}\n` +
    amountLine +
    txnLine +
    `\n` +
    `Next step: enter the PIN from your physical card and your service start date.\n\n` +
    documentText +
    (direct
      ? `Open this link on any device to continue (no SMS code on this step — PIN only):\n${direct}\n\n`
      : "") +
    `If you need to recover on the phone you verified at checkout, use:\n` +
    `${opts.resumeUrl}\n\n` +
    `These links expire in 30 days. If you did not make this purchase, contact support.\n`;
  const html =
    `<p>Thank you for your purchase.</p>` +
    `<p><strong>Plan:</strong> ${escapeHtml(opts.planName)}</p>` +
    (amountFormatted
      ? `<p><strong>Amount paid:</strong> ${escapeHtml(amountFormatted)}</p>`
      : "") +
    (opts.transactionId?.trim()
      ? `<p><strong>Transaction ID:</strong> ${escapeHtml(opts.transactionId.trim())}</p>`
      : "") +
    `<p>Next step: enter the PIN from your physical card and your service start date.</p>` +
    documentHtml +
    (direct
      ? `<p><a href="${escapeHtml(direct)}">Open activation (PIN only, no SMS)</a></p>` +
        `<p style="font-size:12px;color:#555">Anyone with this link can use your paid activation step — treat it like cash.</p>`
      : "") +
    `<p>If the site did not open after payment, you can open this link on the <strong>same phone number</strong> you verified at checkout (SMS code required there):</p>` +
    `<p><a href="${escapeHtml(opts.resumeUrl)}">Continue with phone verification</a></p>` +
    `<p style="font-size:12px;color:#555">Links expire in 30 days. If you did not make this purchase, contact support.</p>`;
  return deliverSimpleMail({ to: opts.to, subject, text, html });
}

export async function sendAdminUserUpdateCodeEmail(
  to: string,
  code: string,
  targetEmail: string,
): Promise<{ ok: boolean; error?: string }> {
  const subject = "Your USALOCALSIM admin update verification code";
  const text =
    `You requested to update admin user: ${targetEmail}\n\n` +
    `Your verification code is: ${code}\n\n` +
    "This code expires in 15 minutes. If you did not request this action, ignore this email.\n";
  const html =
    `<p>You requested to update admin user: <strong>${escapeHtml(targetEmail)}</strong></p>` +
    "<p>Your verification code is:</p>" +
    `<p style="font-size:24px;font-weight:bold;letter-spacing:0.2em">${escapeHtml(code)}</p>` +
    "<p>This code expires in 15 minutes.</p>" +
    "<p>If you did not request this action, you can ignore this email.</p>";
  return deliverSimpleMail({ to, subject, text, html });
}
