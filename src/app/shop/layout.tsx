import { SiteHeader } from "@/components/SiteHeader";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site flex min-h-screen flex-col text-slate-900">
      <SiteHeader />
      <main className="public-main ui-main-scrollbar flex flex-1 flex-col px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
