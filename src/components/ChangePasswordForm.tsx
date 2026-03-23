"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [sent, setSent] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function requestCode() {
    setError(null);
    setSendMessage(null);
    setSuccess(false);
    setRequestLoading(true);
    try {
      const res = await fetch("/api/account/password-change/request", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not send code.");
        setRequestLoading(false);
        return;
      }
      setSent(true);
      setSendMessage(typeof data.message === "string" ? data.message : "Check your email for the code.");
    } catch {
      setError("Could not send code.");
    }
    setRequestLoading(false);
  }

  async function confirmChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setConfirmLoading(true);
    try {
      const res = await fetch("/api/account/password-change/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not update password.");
        setConfirmLoading(false);
        return;
      }
      setSuccess(true);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setSent(false);
      setSendMessage(null);
    } catch {
      setError("Could not update password.");
    }
    setConfirmLoading(false);
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="rounded-2xl border border-white/[0.14] bg-surface-elevated p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]">
        <h2 className="text-sm font-semibold text-white">Step 1 — Email code</h2>
        <p className="mt-1 text-xs text-muted">
          We send a 6-digit code to your account email. Codes expire in 15 minutes.
        </p>
        <button
          type="button"
          onClick={requestCode}
          disabled={requestLoading}
          className="btn-primary mt-4 w-full"
        >
          {requestLoading ? "Sending…" : sent ? "Resend code" : "Send verification code"}
        </button>
        {sendMessage ? <p className="mt-3 text-sm text-accent">{sendMessage}</p> : null}
      </div>

      <form
        onSubmit={confirmChange}
        className="rounded-2xl border border-white/[0.14] bg-surface-elevated p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]"
      >
        <h2 className="text-sm font-semibold text-white">Step 2 — New password</h2>
        <p className="mt-1 text-xs text-muted">Enter the code from your email and choose a new password (min. 8 characters).</p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="otp-code" className="ui-label">
              Verification code
            </label>
            <input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="ui-input tracking-widest"
              placeholder="000000"
              maxLength={12}
            />
          </div>
          <div>
            <label htmlFor="new-pw" className="ui-label">
              New password
            </label>
            <input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="ui-input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm-pw" className="ui-label">
              Confirm new password
            </label>
            <input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="ui-input"
              autoComplete="new-password"
            />
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        {success ? (
          <p className="mt-4 text-sm text-accent">Your password was updated. Use it next time you sign in.</p>
        ) : null}
        <button type="submit" disabled={confirmLoading} className="btn-primary mt-6 w-full">
          {confirmLoading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
