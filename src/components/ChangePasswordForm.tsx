"use client";

import { useState } from "react";

export function ChangePasswordForm({ variant = "admin" }: { variant?: "admin" | "public" }) {
  const pub = variant === "public";
  const [sent, setSent] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const shell = pub
    ? "rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)]"
    : "admin-panel";
  const head = "border-b border-slate-200 bg-slate-50 px-6 py-4";
  const title = "mt-1 text-sm font-semibold text-slate-900";
  const bodyText = "mt-1 text-xs text-slate-600";
  const errClass = "mt-4 text-sm text-red-600";

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
      <div className={`${shell} p-0`}>
        <div className={head}>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Step 1</span>
          <h2 className={title}>Email verification code</h2>
        </div>
        <div className="p-6">
          <p className={bodyText}>We send a 6-digit code to your account email. Codes expire in 15 minutes.</p>
          <button
            type="button"
            onClick={requestCode}
            disabled={requestLoading}
            className="btn-primary mt-4 w-full rounded-xl"
          >
            {requestLoading ? "Sending…" : sent ? "Resend code" : "Send verification code"}
          </button>
          {sendMessage ? <p className="mt-3 text-sm text-accent">{sendMessage}</p> : null}
        </div>
      </div>

      <form onSubmit={confirmChange} className={`${shell} space-y-0 p-0`}>
        <div className={head}>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Step 2</span>
          <h2 className={title}>New password</h2>
          <p className={bodyText}>
            Enter the code from your email and choose a new password (min. 8 characters).
          </p>
        </div>
        <div className="p-6">
          <div className="mt-2 space-y-4">
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
          {error ? <p className={errClass}>{error}</p> : null}
          {success ? (
            <p className="mt-4 text-sm text-accent">Your password was updated. Use it next time you sign in.</p>
          ) : null}
          <button type="submit" disabled={confirmLoading} className="btn-primary mt-6 w-full rounded-xl">
            {confirmLoading ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
