"use client";

import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function LoginPage() {
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
      setError("Invalid email or password.");
      return;
    }
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role === "admin") {
      window.location.href = callbackUrl ?? "/admin";
      return;
    }
    // Dealers should always land on the dealer dashboard after sign-in.
    window.location.href = "/dealer";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="ui-card w-full max-w-sm p-6">
          <h1 className="text-xl font-bold uppercase tracking-tight text-white">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Admin or Dealer access</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="email" className="ui-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="ui-input"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="ui-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="ui-input"
                autoComplete="current-password"
              />
            </div>
            {urlError === "AccountDisabled" && (
              <p className="text-sm text-amber-400/95">
                This account has been disabled. Contact an administrator if you need access.
              </p>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-4 text-center">
            <Link href="/" className="link-accent text-sm">
              ← Back to activation
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
