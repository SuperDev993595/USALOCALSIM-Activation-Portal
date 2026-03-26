import Link from "next/link";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default function DealerChangePasswordPage() {
  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.12)] md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Dealer</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Change password</h1>
        <p className="mt-2 text-sm text-slate-600">We email you a verification code before updating your password.</p>
      </header>
      <ChangePasswordForm variant="public" />
      <footer className="border-t border-slate-200 pt-8">
        <Link
          href="/dealer"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-accent/30 hover:text-accent"
        >
          ← Back to unlock
        </Link>
      </footer>
    </div>
  );
}
