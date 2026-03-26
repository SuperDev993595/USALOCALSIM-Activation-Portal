import Link from "next/link";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default function DealerChangePasswordPage() {
  return (
    <div className="space-y-10">
      <header className="admin-panel">
        <div className="admin-panel-head">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Dealer</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Change password</h1>
          <p className="mt-2 text-sm text-slate-600">We email you a verification code before updating your password.</p>
        </div>
      </header>
      <ChangePasswordForm variant="admin" />
      <footer className="border-t border-slate-200 pt-8">
        <Link
          href="/dealer"
          className="ui-btn-ghost rounded-none text-xs uppercase tracking-[0.18em]"
        >
          ← Back to unlock
        </Link>
      </footer>
    </div>
  );
}
