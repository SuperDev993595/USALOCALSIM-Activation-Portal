import Link from "next/link";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default function DealerChangePasswordPage() {
  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-white/[0.14] bg-surface-elevated p-6 md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent/90">Dealer</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Change password</h1>
        <p className="mt-2 text-sm text-muted">
          We email you a verification code before updating your password.
        </p>
      </header>
      <ChangePasswordForm />
      <footer className="border-t border-white/[0.06] pt-8">
        <Link
          href="/dealer"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-accent"
        >
          ← Back to unlock
        </Link>
      </footer>
    </div>
  );
}
