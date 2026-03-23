import nodemailer from "nodemailer";
import QRCode from "qrcode";

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
