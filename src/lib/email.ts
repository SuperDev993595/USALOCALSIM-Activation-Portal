import nodemailer from "nodemailer";

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

type PlanInfo = { name: string; dataAllowance: string; durationDays: number };

/** Plan-specific success email. Content must match the plan (name, data, duration) as on the site. */
export async function sendSuccessEmail(
  to: string,
  plan: PlanInfo,
  _locale?: string
): Promise<{ ok: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";
  const subject = `Your USALOCALSIM service is now active – ${plan.name}`;
  const text = `Your USALOCALSIM service has been activated.\n\nPlan: ${plan.name}\nData allowance: ${plan.dataAllowance}\nDuration: ${plan.durationDays} days\n\nThank you for choosing USALOCALSIM.`;

  const transport = getTransport();
  if (transport) {
    try {
      await transport.sendMail({ from, to, subject, text });
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
        body: JSON.stringify({ from, to, subject, text }),
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
