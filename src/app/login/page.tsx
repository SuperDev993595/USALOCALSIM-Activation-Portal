"use client";

import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CART_FLOW_CLASS,
  CART_PANEL_CLASS,
  CART_PRIMARY_BUTTON_CLASS,
  CART_TEXT_INPUT_CLASS,
} from "@/lib/cart-panel";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const signInOptions: {
      email: string;
      password: string;
      redirect: false;
      callbackUrl?: string;
    } = {
      email,
      password,
      redirect: false,
    };
    if (callbackUrl) signInOptions.callbackUrl = callbackUrl;
    const res = await signIn("credentials", signInOptions);
    setLoading(false);
    if (res?.error) {
      setError(t("errorInvalid"));
      return;
    }
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role === "admin") {
      window.location.href = callbackUrl ?? "/admin";
      return;
    }
    window.location.href = callbackUrl ?? "/dealer/scan";
  }

  return (
    <div className="cart-flow-page flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
      <div className={`${CART_FLOW_CLASS} w-full max-w-md`}>
        <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout`}>
          <header className="cart-flow-header cart-flow-header--accent">
            <p className="cart-flow-eyebrow">{t("eyebrow")}</p>
            <h1 className="cart-flow-title">{t("title")}</h1>
            <p className="cart-flow-subtitle">{t("subtitle")}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="cart-flow-pill">{t("roleAdmin")}</span>
              <span className="cart-flow-pill">{t("roleDealer")}</span>
            </div>
          </header>

          <div className="cart-flow-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="cart-flow-field">
                <label htmlFor="email" className="cart-flow-field-label">
                  {t("emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={CART_TEXT_INPUT_CLASS}
                  autoComplete="email"
                />
              </div>
              <div className="cart-flow-field">
                <label htmlFor="password" className="cart-flow-field-label">
                  {t("passwordLabel")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={CART_TEXT_INPUT_CLASS}
                  autoComplete="current-password"
                />
              </div>

              {urlError === "AccountDisabled" ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
                  {t("accountDisabled")}
                </p>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" disabled={loading} className={CART_PRIMARY_BUTTON_CLASS}>
                {loading ? t("submitting") : t("submit")}
              </button>
            </form>
          </div>

          <footer className="cart-flow-footer">
            <Link href="/redeem/enter" className="cart-flow-footer-link">
              {t("backToActivation")}
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
