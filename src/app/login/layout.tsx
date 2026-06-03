import { SiteHeader } from "@/components/SiteHeader";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site public-site--cart flex min-h-screen flex-col bg-slate-50/80 text-slate-900">
      <SiteHeader variant="login" />
      <main className="public-main ui-main-scrollbar flex flex-1 flex-col">{children}</main>
    </div>
  );
}
