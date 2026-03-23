import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-6xl font-bold text-accent">404</h1>
        <p className="mt-4 text-muted">This page does not exist.</p>
        <Link href="/" className="btn-primary mt-8">
          Home
        </Link>
      </main>
    </div>
  );
}
