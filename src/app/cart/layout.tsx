import { SiteHeader } from "@/components/SiteHeader";

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site public-site--cart flex min-h-screen flex-col bg-slate-50/80 text-slate-900">
      <SiteHeader variant="checkout" />
      <main className="public-main ui-main-scrollbar mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
